// apps/redirect-service/src/rabbitmq-consumer.ts
import amqplib from 'amqplib';
import type { Connection, Channel, ConsumeMessage } from 'amqplib';
import { logger } from './config/logger.js';
import { getRedisClient } from './config/redis.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const QUEUE_NAME = process.env.RABBITMQ_QUEUE_NAME || 'new_url_queue'; 

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
      channel?.nack(msg, false, false); 
      return;
    }

    const redisClient = getRedisClient();
    await redisClient.set(`url:${shortId}`, longUrl); 
    logger.info(`Redirect Service: Cached mapping in Redis: ${shortId} -> ${longUrl.substring(0, 50)}...`);
    
    channel?.ack(msg); 
  } catch (error) {
    logger.error('Redirect Service: Error processing RabbitMQ message:', {
      content: msg.content.toString(),
      error: error instanceof Error ? error.message : String(error),
    });
    channel?.nack(msg, false, false); 
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

    channel.prefetch(1); 

    channel.consume(QUEUE_NAME, processMessage, {
    });
  } catch (error) {
    logger.error('Redirect Service: Failed to start RabbitMQ consumer:', error);
    throw error; 
  }
}
