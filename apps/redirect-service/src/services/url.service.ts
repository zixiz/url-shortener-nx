import { getRedisClient } from '../config/redis';

/**
 * Fetches the long URL for a given shortId from Redis.
 * @param shortId - The shortId to look up.
 * @returns The long URL if found, otherwise null.
 */
export async function getLongUrl(shortId: string): Promise<string | null> {
  const redisClient = getRedisClient();
  return redisClient.get(`url:${shortId}`);
} 