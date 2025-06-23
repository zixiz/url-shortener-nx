/**
 * Controller for handling URL redirection requests.
 * Validates input, fetches the long URL from Redis, handles 404s, and triggers click event publishing.
 */
import { Request, Response, NextFunction } from 'express';
import { validateShortId } from '../validators/url.validator';
import { getLongUrl } from '../services/url.service';
import { publishClickEvent } from '../services/queue.service';
import { logger } from '../config/logger';
import { ClickEvent } from '../types/events';

export class RedirectController {
  /**
   * Handles redirecting a short URL to its long URL, and publishes a click event asynchronously.
   */
  async handleRedirect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shortId } = req.params;
      validateShortId(shortId);

      const longUrl = await getLongUrl(shortId);
      if (!longUrl) {
        const notFoundUrl = process.env.WEB_APP_NOT_FOUND_URL || 'http://localhost:4200/404';
        logger.warn(`Redirect Service: ShortId not found, redirecting to web app not found page: ${notFoundUrl}`);
        return res.redirect(302, notFoundUrl);
      }

      logger.info(`Redirect Service: Redirecting ${shortId} to ${longUrl.substring(0, 70)}...`);
      res.redirect(302, longUrl);

      // Fire-and-forget: publish click event asynchronously
      const event: ClickEvent = {
        shortId,
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent'],
        referrer: req.headers['referer'] as string | undefined,
      };
      publishClickEvent(event).catch((mqError) => {
        logger.error('Redirect Service: Exception while trying to publish click event to RabbitMQ.', {
          shortId,
          error: mqError instanceof Error ? mqError.message : String(mqError)
        });
      });
    } catch (err) {
      next(err);
    }
  }
} 