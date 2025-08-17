import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { logger } from '../config/logger.js';
import { createUrlSchema } from '../validators/url.validator.js';
import { UrlService } from '../services/url.service.js';

const urlService = new UrlService();

export class UrlController {
  createShortUrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      let longUrl = req.body.longUrl;
      if (typeof longUrl === 'string' && !/^https?:\/\//i.test(longUrl)) {
        longUrl = 'http://' + longUrl;
      }
      const { error, value } = createUrlSchema.validate({ longUrl });
      if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
      }
      const userId = req.user?.id || null;
      const newUrl = await urlService.createShortUrl(value.longUrl, userId);
      const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:3003`;
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
      const userUrls = await urlService.listMyUrls(userId);
      const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:3003`;
      const responseUrls = userUrls.map(url => ({
        id: url.id,
        shortId: url.shortId,
        longUrl: url.longUrl,
        fullShortUrl: `${appBaseUrl}/${url.shortId}`,
        clickCount: url.clickCount,
        createdAt: url.createdAt,
      }));
      res.status(200).json(responseUrls);
    } catch (err) {
      logger.error('Error listing user URLs', { userId: req.user?.id, error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  };

  getUrlStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { shortId } = req.params;
    logger.info(`Stats request for ${shortId} (from DB)`);
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      const urlDetails = await urlService.getUrlStats(shortId, req.user.id);
      if (!urlDetails) {
        res.status(404).json({ message: 'Short URL not found or you do not have access.' });
        return;
      }
      res.status(200).json({
        shortId: urlDetails.shortId,
        longUrl: urlDetails.longUrl,
        clickCount: urlDetails.clickCount,
      });
    } catch (err) {
      logger.error('Error getting URL stats', { shortId, error: err instanceof Error ? err.message : String(err) });
      next(err);
    }
  };

  deleteUrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { shortId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized. User must be logged in to delete a URL.' });
      return;
    }

    if (!shortId) {
      res.status(400).json({ message: 'Bad Request: shortId parameter is required.' });
      return;
    }

    try {
      const result = await urlService.deleteUrl(shortId, userId);

      switch (result) {
        case 'SUCCESS':
          res.status(204).send();
          break;
        case 'NOT_FOUND':
          res.status(404).json({ message: 'URL not found.' });
          break;
        case 'FORBIDDEN':
          res.status(403).json({ message: 'You do not have permission to delete this URL.' });
          break;
        default:
          // This case should ideally not be reached if the service returns the expected values.
          logger.error('Unexpected result from deleteUrl service', { result, shortId, userId });
          next(new Error('An unexpected error occurred during URL deletion.'));
      }
    } catch (err) {
      logger.error('Error during URL deletion process', { 
        shortId, 
        userId, 
        error: err instanceof Error ? err.message : String(err) 
      });
      next(err);
    }
  };
}