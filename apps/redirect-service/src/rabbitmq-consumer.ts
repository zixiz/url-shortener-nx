// apps/redirect-service/src/rabbitmq-consumer.ts
import amqplib from 'amqplib';
import type { Connection, Channel, ConsumeMessage } from 'amqplib';
import { logger } from './config/logger.js';
import { getRedisClient } from './config/redis.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const QUEUE_NAME = process.env.RABBITMQ_QUEUE_NAME || 'new_url_queue'; // Must match what management-service publishes to

let connection: Connection | null = null;
let channel: Channel | null = null;

async function processMessage(msg: ConsumeMessage | null) {
  if (msg === null) {
    return;
  }

  try {
    const messageContent = msg.content.toString();
    logger.info(`Redirect Service: Received message from RabbitMQ: ${messageContent}`);
    const { shortId, longUrl } = JSON.parse(messageContent);

    if (!shortId || !longUrl) {
      logger.warn('Redirect Service: Invalid message content from RabbitMQ, missing shortId or longUrl.', { messageContent });
      channel?.nack(msg, false, false); // Don't requeue malformed messages
      return;
    }

    const redisClient = getRedisClient();
    // Store shortId -> longUrl mapping. No expiry needed unless specified by requirements.
    await redisClient.set(`url:${shortId}`, longUrl); 
    logger.info(`Redirect Service: Cached mapping in Redis: ${shortId} -> ${longUrl.substring(0, 50)}...`);
    
    channel?.ack(msg); // Acknowledge message processing
  } catch (error) {
    logger.error('Redirect Service: Error processing RabbitMQ message:', {
      content: msg.content.toString(),
      error: error instanceof Error ? error.message : String(error),
    });
    // Nack the message and decide whether to requeue based on the error type
    // For parsing errors or invalid data, don't requeue. For transient Redis errors, maybe requeue.
    channel?.nack(msg, false, false); // Example: Don't requeue on error
  }
}

export async function startRabbitMQConsumer(): Promise<void> {
  try {
    logger.info(`Redirect Service: Attempting to connect to RabbitMQ at ${RABBITMQ_URL} for consuming.`);
    connection = await amqplib.connect(RABBITMQ_URL);
    logger.info('Redirect Service: RabbitMQ connection successful for consumer.');

    connection.on('error', (err) => {
      logger.error('Redirect Service: RabbitMQ consumer connection error', err);
      connection = null; channel = null;
      // Implement retry/reconnect logic if needed
      // setTimeout(startRabbitMQConsumer, 5000);
    });
    connection.on('close', () => {
      logger.warn('Redirect Service: RabbitMQ consumer connection closed.');
      connection = null; channel = null;
      // Implement retry/reconnect logic if needed
    });

    channel = await connection.createChannel();
    logger.info('Redirect Service: RabbitMQ channel created for consumer.');

    await channel.assertQueue(QUEUE_NAME, { durable: true });
    logger.info(`Redirect Service: Waiting for messages in queue: ${QUEUE_NAME}. To exit press CTRL+C`);

    // Fair dispatch: process one message at a time per consumer.
    // Adjust prefetch count based on your processing capacity and message type.
    channel.prefetch(1); 

    channel.consume(QUEUE_NAME, processMessage, {
      // noAck: false is default, meaning we must explicitly ack/nack
    });
  } catch (error) {
    logger.error('Redirect Service: Failed to start RabbitMQ consumer:', error);
    throw error; // Propagate error to allow bootstrap to handle (e.g., exit or retry)
  }
}
