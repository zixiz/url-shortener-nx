import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source.js';
import { Url } from '../entities/url.entity.js';
//import { User } from '../entities/user.entity.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js'; 
import { logger } from '../config/logger.js';
//import { nanoid } from 'nanoid'; 
// import { getRabbitMQChannel } from '../config/rabbitmq.js'; // For publishing
// import { getRedisClient } from '../config/redis.js'; // For stats

export class UrlController {
  private urlRepository = AppDataSource.getRepository(Url);
  // private userRepository = AppDataSource.getRepository(User); // If needed

  // POST /api/urls - Create Short URL
  createShortUrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Logic to be implemented:
    // 1. Validate input (longUrl, optional customAlias)
    // 2. Check if longUrl already exists for this user (optional optimization)
    // 3. Generate unique shortId using nanoid (ensure uniqueness by checking DB)
    // 4. Save to Url entity (longUrl, shortId, userId if req.user exists)
    // 5. Publish (shortId, longUrl) to RabbitMQ for redirect-service
    // 6. Construct full short URL (using APP_BASE_URL from .env) and return
    logger.info('Placeholder for createShortUrl');
    try {
      // TEMP RESPONSE
      res.status(501).json({ message: 'Create Short URL not implemented yet.' });
    } catch (err) {
      next(err);
    }
  };

  // GET /api/urls/mine - List user's URLs
  listMyUrls = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Logic to be implemented:
    // 1. This route MUST be protected by authenticateJWT middleware
    // 2. Get userId from req.user.id
    // 3. Fetch URLs from DB where userId matches
    // 4. Return list of URLs
    logger.info('Placeholder for listMyUrls');
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      // TEMP RESPONSE
      res.status(501).json({ message: 'List My URLs not implemented yet.', userId: req.user.id });
    } catch (err) {
      next(err);
    }
  };

  // GET /api/stats/{shortId} - Get Click Stats
  getUrlStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Logic to be implemented:
    // 1. Get shortId from req.params
    // 2. Fetch click count from Redis (e.g., GET clicks:{shortId})
    // 3. Return shortId and click count
    logger.info('Placeholder for getUrlStats');
    const { shortId } = req.params;
    try {
      // TEMP RESPONSE
      res.status(501).json({ message: 'Get URL Stats not implemented yet.', shortId });
    } catch (err) {
      next(err);
    }
  };
}