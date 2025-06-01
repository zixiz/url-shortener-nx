import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source.js';
import { Url } from '../entities/url.entity.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { logger } from '../config/logger.js';
import { nanoid } from 'nanoid'; // Default import for nanoid v4+ (ESM)
import { getRabbitMQChannel } from '../config/rabbitmq.js';
import { getRedisClient } from '../config/redis.js';
import { createUrlSchema } from '../validators/url.validator.js';

const SHORT_ID_LENGTH = 11; 
const RABBITMQ_NEW_URL_QUEUE = process.env.RABBITMQ_NEW_URL_QUEUE || 'new_url_queue'; 

export class UrlController {
  private urlRepository = AppDataSource.getRepository(Url);

  // POST /api/urls - Create Short URL
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
      const maxAttempts = 5; // Prevent infinite loop in case of extremely rare hash collisions

      // Generate a unique shortId
      do {
        shortId = nanoid(SHORT_ID_LENGTH);
        existingUrl = await this.urlRepository.findOneBy({ shortId });
        attempts++;
        if (attempts > maxAttempts && existingUrl) {
            logger.error('Failed to generate unique shortId after several attempts', { longUrl });
            throw new Error('Could not generate a unique short ID.');
        }
      } while (existingUrl);

      const newUrl = new Url();
      newUrl.longUrl = longUrl;
      newUrl.shortId = shortId;
      newUrl.userId = userId;

      await this.urlRepository.save(newUrl);

      // Publish to RabbitMQ for redirect-service to cache
      try {
        const channel = getRabbitMQChannel();
        // Ensure queue exists (idempotent operation, usually done by consumer but good for producer too)
        await channel.assertQueue(RABBITMQ_NEW_URL_QUEUE, { durable: true });
        channel.sendToQueue(
          RABBITMQ_NEW_URL_QUEUE,
          Buffer.from(JSON.stringify({ shortId: newUrl.shortId, longUrl: newUrl.longUrl })),
          { persistent: true } // Make message persistent
        );
        logger.info('Published new URL mapping to RabbitMQ', { shortId: newUrl.shortId });
      } catch (mqError) {
        logger.error('Failed to publish URL mapping to RabbitMQ', { shortId: newUrl.shortId, error: mqError });
        // Decide how to handle this:
        // - Continue and return success to user (redirect-service might miss caching this one)
        // - Return an error (makes URL creation dependent on RabbitMQ)
        // For now, log and continue.
      }

      const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.REDIRECT_SERVICE_PORT || 3003}`;
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

  // GET /api/urls/mine - List user's URLs
  listMyUrls = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) { // Should be caught by authenticateJWT, but defensive check
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      const userId = req.user.id;
      const userUrls = await this.urlRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' }, // Optional: order by most recent
      });

      const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.REDIRECT_SERVICE_PORT || 3003}`;
      const responseUrls = userUrls.map(url => ({
        ...url,
        fullShortUrl: `${appBaseUrl}/${url.shortId}`
      }));

      res.status(200).json(responseUrls);
    } catch (err) {
      logger.error('Error listing user URLs', { userId: req.user?.id, error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  };

  // GET /api/stats/:shortId - Get Click Stats
  getUrlStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { shortId } = req.params;
    try {
      const redisClient = getRedisClient();
      const clickCountStr = await redisClient.get(`clicks:${shortId}`);
      const clickCount = clickCountStr ? parseInt(clickCountStr, 10) : 0;

      // Optional: You could also fetch the URL details from PostgreSQL if you want to show longUrl etc.
      // const urlDetails = await this.urlRepository.findOneBy({ shortId });
      // if (!urlDetails && clickCount === 0) { // Or if URL details are considered essential
      //    res.status(404).json({ message: 'Short URL not found or no stats available.' });
      //    return;
      // }

      res.status(200).json({
        shortId,
        // longUrl: urlDetails?.longUrl, // If fetching from DB
        clickCount,
      });
    } catch (err) {
      logger.error('Error getting URL stats', { shortId, error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  };
}