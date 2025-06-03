import { Router, Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';

const router = Router();

router.get('/:shortId', async (req: Request, res: Response, next: NextFunction) => {
  const { shortId } = req.params;

  if (!shortId || shortId.length > 20) { // Basic validation for shortId format/length
    // (assuming nanoid(11) is used, so length should be reasonable)
    logger.warn('Redirect attempt with invalid shortId format', { shortId });
    return res.status(400).send('Invalid short URL format.');
  }

  logger.debug(`Redirect request for shortId: ${shortId}`);

  try {
    const redisClient = getRedisClient();
    const longUrl = await redisClient.get(`url:${shortId}`);

    if (longUrl) {
      logger.info(`Redirecting ${shortId} to ${longUrl.substring(0,70)}...`);
      res.redirect(302, longUrl); // Perform the redirect (302 for temporary, 301 for permanent)

      // Asynchronously increment click count in Redis.
      // No need to await this for the redirect response. Fire and forget.
      redisClient.incr(`clicks:${shortId}`).catch(err => {
        logger.error('Failed to increment click count in Redis', { shortId, error: err });
      });
    } else {
      logger.warn(`ShortId not found in Redis for redirection: ${shortId}`);
      res.status(404).send('Short URL not found.');
    }
  } catch (error) {
    logger.error('Error during redirection:', { shortId, error });
    // Pass to a generic error handler or send a generic error
    // Avoid calling next(error) if you've already sent a response or want to control it here.
    if (!res.headersSent) {
      res.status(500).send('Error processing your request.');
    }
  }
});

export default router;