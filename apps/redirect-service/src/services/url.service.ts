import { getRedisClient } from '../config/redis';
import { logger } from '../config/logger.js';

/**
 * Fetches the long URL for a given shortId from Redis.
 * @param shortId - The shortId to look up.
 * @returns The long URL if found, otherwise null.
 */
export async function getLongUrl(shortId: string): Promise<string | null> {
  const redisClient = getRedisClient();
  return redisClient.get(`url:${shortId}`);
}

/**
 * Deletes a URL from the Redis cache.
 */
export async function deleteUrlFromCache(shortId: string): Promise<number> {
  const redisClient = getRedisClient();
  const key = `url:${shortId}`;
  const result = await redisClient.del(key);
  if (result > 0) {
    logger.info(`Successfully removed key from Redis cache: ${key}`);
  } else {
    logger.warn(`Attempted to delete key from Redis cache, but it was not found: ${key}`);
  }
  return result;
} 