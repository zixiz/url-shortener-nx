import type { Channel, ConsumeMessage } from 'amqplib';
import { logger } from './config/logger.js';
import { AppDataSource } from './data-source.js';
import { Url } from './entities/url.entity.js';
import { getRabbitMQChannel, connectRabbitMQ } from './config/rabbitmq.js'; 

const CLICK_EVENTS_QUEUE = process.env.RABBITMQ_CLICK_EVENTS_QUEUE || 'url_clicked_events_queue'; 

interface ClickEventMessage {
  shortId: string;
  timestamp?: string;
}

async function processClickMessage(msg: ConsumeMessage | null, channel: Channel) {
  if (msg === null) {
    logger.warn('Management Click Consumer: Received null message.');
    return;
  }

  const messageContent = msg.content.toString();
  try {
    logger.info(`Management Click Consumer: Received click event: ${messageContent}`);
    const clickEvent = JSON.parse(messageContent) as ClickEventMessage;

    if (!clickEvent.shortId) {
      logger.warn('Management Click Consumer: Invalid click event, missing shortId.', { messageContent });
      channel.nack(msg, false, false); // Don't requeue malformed
      return;
    }

    if (!AppDataSource.isInitialized) {
        logger.error('Management Click Consumer: AppDataSource not initialized. Nacking and requeueing.');
        channel.nack(msg, false, true); // Requeue if DB is not ready
        return;
    }
    const urlRepository = AppDataSource.getRepository(Url);
    
    const updateResult = await urlRepository.increment(
        { shortId: clickEvent.shortId },
        'clickCount',
        1
    );

    if (updateResult.affected && updateResult.affected > 0) {
        logger.info(`Management Click Consumer: Incremented click count for ${clickEvent.shortId}.`);
    } else {
        logger.warn(`Management Click Consumer: shortId ${clickEvent.shortId} not found for click increment. Acknowledging message.`);
    }
    
    channel.ack(msg);
  } catch (error) {
    logger.error('Management Click Consumer: Error processing click event message.', {
      content: messageContent,
      errorMsg: error instanceof Error ? error.message : String(error),
    });
    const shouldRequeue = !(error instanceof SyntaxError || error instanceof TypeError);
    channel.nack(msg, false, shouldRequeue);
  }
}

export async function startClickEventConsumer(): Promise<void> {
  try {
    // Ensure the main RabbitMQ connection and publisher channel are up via existing utility
    // This connectRabbitMQ might also establish the channel we can use or we get it.
    await connectRabbitMQ(); // Ensures connection is attempted/established by the shared utility
    const channel = getRabbitMQChannel(); // Get the shared channel

    logger.info(`Management Click Consumer: Using shared channel. Setting up consumer for queue: ${CLICK_EVENTS_QUEUE}.`);
    
    await channel.assertQueue(CLICK_EVENTS_QUEUE, { durable: true });
    logger.info(`Management Click Consumer: Asserted queue '${CLICK_EVENTS_QUEUE}'. Waiting for click events.`);
    
    channel.prefetch(1); // Process one message at a time from this consumer
    
    channel.consume(CLICK_EVENTS_QUEUE, (msg) => processClickMessage(msg, channel), { 
      noAck: false // Manual acknowledgment
    });

    logger.info('Management Click Consumer: Consumer started successfully.');

  } catch (error) {
    logger.error('Management Click Consumer: Failed to start RabbitMQ click event consumer.', {
        errorMessage: error instanceof Error ? error.message : String(error)
    });
    // Optional: Implement retry logic here if connectRabbitMQ fails,
    // but the shared utility might have its own retries.
    // For now, if it fails, the consumer won't start.
    throw error; // Allow bootstrap to know it failed
  }
}
