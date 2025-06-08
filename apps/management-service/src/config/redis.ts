import * as IORedisNamespace from 'ioredis'; 
import { logger } from './logger.js';

let redisClient: IORedisNamespace.Redis | null = null;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export function connectRedis(): IORedisNamespace.Redis {
  if (redisClient) {
    return redisClient;
  }

  try {
    logger.info(`Attempting to connect to Redis at ${REDIS_URL}`);
    const client = new IORedisNamespace.Redis(REDIS_URL, { 
      maxRetriesPerRequest: 3,
    });

    client.on('connect', () => {
      logger.info('Management Service: Connected to Redis successfully.');
    });

    client.on('error', (err) => {
      logger.error('Management Service: Redis client connection error:', err);
    });
    
    redisClient = client;
    return redisClient;
  } catch (error) {
    logger.error('Management Service: Failed to initialize Redis client:', error);
    throw error;
  }
}

export function getRedisClient(): IORedisNamespace.Redis {
  if (!redisClient) {
    logger.warn('Management Service: Redis client not available, attempting to connect now...');
    return connectRedis(); 
  }
  return redisClient;
}