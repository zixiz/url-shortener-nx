// apps/management-service/src/config/redis.ts
import Redis from 'ioredis';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export function connectRedis(): Redis {
  if (redisClient) {
    // logger.debug('Redis client already connected.');
    return redisClient;
  }

  try {
    logger.info(`Attempting to connect to Redis at ${REDIS_URL}`);
    const client = new Redis(REDIS_URL, {
      // Optional: Add more ioredis options here if needed
      // e.g., lazyConnect: true, enableOfflineQueue: false
      maxRetriesPerRequest: 3, // Example option
    });

    client.on('connect', () => {
      logger.info('Connected to Redis successfully.');
    });

    client.on('error', (err) => {
      logger.error('Redis connection error:', err);
      // More robust error handling might involve attempting to reconnect
      // or flagging the service as degraded.
    });

    client.on('reconnecting', () => {
      logger.warn('Reconnecting to Redis...');
    });
    
    client.on('end', () => {
      logger.warn('Redis connection ended.');
      redisClient = null; // Allow re-connection attempt on next getRedisClient call if needed
    });


    redisClient = client;
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis client:', error);
    throw error; // Re-throw to be handled by bootstrap
  }
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    // Attempt to connect if not already connected (e.g., if initial connect failed or connection was lost)
    // Or, you might prefer to throw an error if not connected during bootstrap.
    // For simplicity here, we'll try to connect again, but in a real app,
    // you'd likely ensure connectRedis() is called successfully during bootstrap.
    logger.warn('Redis client not available, attempting to connect now...');
    return connectRedis(); // This will throw if it fails again
  }
  return redisClient;
}

// Optional: Graceful shutdown for Redis
// process.on('SIGINT', async () => {
//   if (redisClient) {
//     logger.info('SIGINT received. Disconnecting Redis client...');
//     await redisClient.quit();
//   }
// });
// process.on('SIGTERM', async () => {
//   if (redisClient) {
//     logger.info('SIGTERM received. Disconnecting Redis client...');
//     await redisClient.quit();
//   }
// });