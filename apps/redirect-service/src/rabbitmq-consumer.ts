import amqplib from 'amqplib';
import type { Connection, Channel, ConsumeMessage, ConfirmChannel } from 'amqplib';
import { logger } from './config/logger.js'; 
import { getRedisClient } from './config/redis.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const CONSUME_QUEUE_NAME = process.env.RABBITMQ_QUEUE_NAME || 'new_url_queue'; 

let connection: Connection | null = null;
let consumerChannel: Channel | null = null;
let publisherChannel: ConfirmChannel | null = null; 

let connectionPromise: Promise<void> | null = null;

async function processMessage(msg: ConsumeMessage | null) {
  if (msg === null) {
    logger.warn('Redirect Service Consumer: Received null message. Ignoring.');
    return;
  }

  if (!consumerChannel) {
    logger.error('Redirect Service Consumer: Consumer channel is null, cannot process message. Nacking and requeueing.');
    return; 
  }

  try {
    const messageContent = msg.content.toString();
    logger.info(`Redirect Service Consumer: Received message from RabbitMQ: ${messageContent}`);
    const { shortId, longUrl } = JSON.parse(messageContent);

    if (!shortId || !longUrl) {
      logger.warn('Redirect Service Consumer: Invalid message content from RabbitMQ, missing shortId or longUrl.', { messageContent });
      consumerChannel.nack(msg, false, false); 
      return;
    }

    const redisClient = getRedisClient();
    await redisClient.set(`url:${shortId}`, longUrl); 
    logger.info(`Redirect Service Consumer: Cached mapping in Redis: ${shortId} -> ${longUrl.substring(0, 50)}...`);
    
    consumerChannel.ack(msg); 
  } catch (error) {
    logger.error('Redirect Service Consumer: Error processing RabbitMQ message.', {
      content: msg.content.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    if (consumerChannel) {
      consumerChannel.nack(msg, false, false); 
    } else {
      logger.error('Redirect Service Consumer: Consumer channel is null, cannot NACK message during error handling.');
    }
  }
}

export async function startRabbitMQ(): Promise<void> {
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      if (connection) {
          logger.info('Redirect Service: RabbitMQ connection already exists.');
      } else {
          logger.info(`Redirect Service: Attempting to connect to RabbitMQ at ${RABBITMQ_URL}.`);
          connection = await amqplib.connect(RABBITMQ_URL);
          logger.info('Redirect Service: RabbitMQ connection successful.');

          connection.on('error', (err) => {
            logger.error('Redirect Service: RabbitMQ connection error event:', err);
            connection = null; consumerChannel = null; publisherChannel = null;
            connectionPromise = null;
          });
          connection.on('close', () => {
            logger.warn('Redirect Service: RabbitMQ connection closed event.');
            connection = null; consumerChannel = null; publisherChannel = null;
            connectionPromise = null; 
          });
      }

      if (!consumerChannel && connection) {
        consumerChannel = await connection.createChannel();
        logger.info('Redirect Service: RabbitMQ consumer channel created.');
        await consumerChannel.assertQueue(CONSUME_QUEUE_NAME, { durable: true });
        logger.info(`Redirect Service: Consumer waiting for messages in queue: ${CONSUME_QUEUE_NAME}.`);
        consumerChannel.prefetch(1); 
        consumerChannel.consume(CONSUME_QUEUE_NAME, processMessage, { noAck: false });
      }

      if (!publisherChannel && connection) {
        publisherChannel = await connection.createConfirmChannel();
        logger.info('Redirect Service: RabbitMQ publisher channel created.');
        publisherChannel.on('error', (err) => {
            logger.error('Redirect Service: RabbitMQ publisher channel error:', err);
            publisherChannel = null;
        });
        publisherChannel.on('close', () => {
            logger.warn('Redirect Service: RabbitMQ publisher channel closed.');
            publisherChannel = null;
        });
      }

    } catch (error) {
      logger.error('Redirect Service: Failed to start RabbitMQ components:', error);
      connectionPromise = null;
      if (connection && !consumerChannel) await connection.close().catch(e => logger.error("Error closing connection", e));
      connection = null; 
      consumerChannel = null; 
      publisherChannel = null;
      throw error; 
    }
  })();
  
  try {
    await connectionPromise;
  } catch (error) {
    throw error;
  }
}

export function getPublisherChannel(): ConfirmChannel {
  if (!publisherChannel) {
    logger.error('Redirect Service: RabbitMQ publisher channel is not available. Ensure startRabbitMQ completed successfully.');
    throw new Error('RabbitMQ publisher channel not available.');
  }
  return publisherChannel;
}

async function closeRabbitMQ() {
    if (consumerChannel) {
        try { await consumerChannel.close(); logger.info('Redirect Service: Consumer channel closed.'); } 
        catch (e) { logger.error('Error closing consumer channel', e); }
        consumerChannel = null;
    }
    if (publisherChannel) {
        try { await publisherChannel.close(); logger.info('Redirect Service: Publisher channel closed.'); }
        catch (e) { logger.error('Error closing publisher channel', e); }
        publisherChannel = null;
    }
    if (connection) {
        try { await connection.close(); logger.info('Redirect Service: RabbitMQ connection closed.'); }
        catch (e) { logger.error('Error closing RabbitMQ connection', e); }
        connection = null;
    }
    connectionPromise = null;
}

process.on('SIGINT', async () => { logger.info('SIGINT received'); await closeRabbitMQ(); process.exit(0); });
process.on('SIGTERM', async () => { logger.info('SIGTERM received'); await closeRabbitMQ(); process.exit(0); });