import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source.js';
import { Url } from '../entities/url.entity.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { logger } from '../config/logger.js';
import { nanoid } from 'nanoid';
import { getRabbitMQChannel } from '../config/rabbitmq.js';
import { getRedisClient } from '../config/redis.js'; // Ensure this is implemented correctly
import { createUrlSchema } from '../validators/url.validator.js';

const SHORT_ID_LENGTH = 11;
const RABBITMQ_NEW_URL_QUEUE = process.env.RABBITMQ_NEW_URL_QUEUE || 'new_url_queue';

export class UrlController {
  private urlRepository = AppDataSource.getRepository(Url);

  createShortUrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = createUrlSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
      }

      const { longUrl } = value;
      const userId = req.user?.id || null;
      
      let shortId: string;
      let existingUrl: Url | null;
      let attempts = 0;
      const maxAttempts = 5; 

      do {
        shortId = nanoid(SHORT_ID_LENGTH);
        existingUrl = await this.urlRepository.findOneBy({ shortId });
        attempts++;
        if (attempts > maxAttempts && existingUrl) {
            logger.error('Failed to generate unique shortId after several attempts', { longUrl, attempts });
            // Consider a more specific error for the client or just a generic 500
            return next(new Error('Could not generate a unique short ID. Please try again.'));
        }
      } while (existingUrl);

      const newUrl = new Url();
      newUrl.longUrl = longUrl;
      newUrl.shortId = shortId;
      newUrl.userId = userId;

      await this.urlRepository.save(newUrl);

      try {
        const channel = getRabbitMQChannel();
        await channel.assertQueue(RABBITMQ_NEW_URL_QUEUE, { durable: true });
        channel.sendToQueue(
          RABBITMQ_NEW_URL_QUEUE,
          Buffer.from(JSON.stringify({ shortId: newUrl.shortId, longUrl: newUrl.longUrl })),
          { persistent: true }
        );
        logger.info('Published new URL mapping to RabbitMQ', { shortId: newUrl.shortId });
      } catch (mqError) {
        logger.error('Failed to publish URL mapping to RabbitMQ. URL still created.', { 
            shortId: newUrl.shortId, 
            error: mqError instanceof Error ? mqError.message : String(mqError) 
        });
        // Continue, as URL creation in DB was successful. Redirect service might miss this one for caching.
      }

      const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:3003`; // 3003 is redirect-service port
      const fullShortUrl = `${appBaseUrl}/${newUrl.shortId}`;

      res.status(201).json({
        message: 'Short URL created successfully.',
        id: newUrl.id,
        shortId: newUrl.shortId,
        longUrl: newUrl.longUrl,
        fullShortUrl: fullShortUrl,
        userId: newUrl.userId,
      });
    } catch (err) {
      logger.error('Error creating short URL', { error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  };

  listMyUrls = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      const userId = req.user.id;
      const userUrls = await this.urlRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:3003`;
      const responseUrls = userUrls.map(url => ({
        id: url.id,
        shortId: url.shortId,
        longUrl: url.longUrl,
        fullShortUrl: `${appBaseUrl}/${url.shortId}`,
        clickCount: url.clickCount, // Displaying the (potentially stale) DB click count
        createdAt: url.createdAt,
      }));

      res.status(200).json(responseUrls);
    } catch (err) {
      logger.error('Error listing user URLs', { userId: req.user?.id, error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  };

  getUrlStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { shortId } = req.params;
    try {
      const redisClient = getRedisClient();
      if (!redisClient) { // Defensive check if getRedisClient can return null (it shouldn't if bootstrap is correct)
        logger.error('Redis client not available for getUrlStats');
        return next(new Error('Server error: Stats service temporarily unavailable.'));
      }
      const clickCountStr = await redisClient.get(`clicks:${shortId}`);
      const clickCount = clickCountStr ? parseInt(clickCountStr, 10) : 0;

      // Optionally, fetch URL details from DB to confirm existence or show longUrl
      const urlDetails = await this.urlRepository.findOneBy({ shortId });
      if (!urlDetails && clickCount === 0) { 
         // If we have no clicks and no DB entry, it's likely an invalid shortId
         res.status(404).json({ message: 'Short URL not found.' });
         return;
      }

      res.status(200).json({
        shortId,
        longUrl: urlDetails?.longUrl, // Show longUrl if found
        clickCount,
      });
    } catch (err) {
      logger.error('Error getting URL stats', { shortId, error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  };
}