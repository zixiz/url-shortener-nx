import amqplib from 'amqplib';
import { logger } from './logger.js';
import type { Connection, Channel, ConfirmChannel } from 'amqplib';

let connectionInstance: Connection | null = null;
let channelInstance: Channel | ConfirmChannel | null = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
let connectionPromise: Promise<Connection> | null = null;

async function establishConnection(): Promise<Connection> {
  logger.info(`Attempting to connect to RabbitMQ at ${RABBITMQ_URL}`);
  const conn = await amqplib.connect(RABBITMQ_URL); // NO CAST
  logger.info('RabbitMQ raw connection successful.');

  conn.on('error', (err) => {
    logger.error('RabbitMQ connection error event:', err);
    if (connectionInstance === conn) {
      connectionInstance = null;
      channelInstance = null;
      connectionPromise = null;
    }
  });

  conn.on('close', () => {
    logger.warn('RabbitMQ connection closed event.');
    if (connectionInstance === conn) {
      connectionInstance = null;
      channelInstance = null;
      connectionPromise = null;
    }
  });
  return conn; // conn is Connection
}

export async function connectRabbitMQ(): Promise<void> {
  if (connectionInstance && channelInstance) {
    return;
  }

  if (!connectionPromise) {
    connectionPromise = establishConnection();
  }

  try {
    const conn = await connectionPromise; 
    
    if (!conn) { // Basic null check, though establishConnection should throw if it can't connect
        logger.error('RabbitMQ connection promise resolved to null/undefined.');
        connectionPromise = null;
        throw new Error('Failed to establish RabbitMQ connection (promise resolved null).');
    }

    connectionInstance = conn;

    if (!channelInstance) {
        const ch = await connectionInstance.createChannel(); // NO CAST
        logger.info('RabbitMQ channel created.');
        channelInstance = ch;
    }

  } catch (error) {
    logger.error('Failed to connect to RabbitMQ or create channel in connectRabbitMQ', error);
    connectionPromise = null;
    connectionInstance = null;
    channelInstance = null;
    throw error; 
  }
}

export function getRabbitMQChannel(): Channel | ConfirmChannel {
  if (!channelInstance) {
    logger.error('RabbitMQ channel is not available. Call connectRabbitMQ first or ensure connection is active.');
    throw new Error('RabbitMQ channel not available.');
  }
  return channelInstance;
}

export async function closeRabbitMQConnection(): Promise<void> {
  const ch = channelInstance;
  channelInstance = null;
  if (ch) {
    try {
      await ch.close();
      logger.info('RabbitMQ channel closed on demand.');
    } catch (error) {
      logger.error('Error closing RabbitMQ channel on demand', error);
    }
  }

  const conn = connectionInstance;
  connectionInstance = null;
  connectionPromise = null;
  if (conn) {
    try {
      await conn.close(); // NO CAST
      logger.info('RabbitMQ connection closed on demand.');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection on demand', error);
    }
  }
}

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Closing RabbitMQ connection...');
  await closeRabbitMQConnection();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Closing RabbitMQ connection...');
  await closeRabbitMQConnection();
  process.exit(0);
});