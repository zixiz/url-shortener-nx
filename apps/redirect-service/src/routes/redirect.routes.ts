import { Router, Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { getPublisherChannel } from '../rabbitmq-consumer.js'; 

const router = Router();
const CLICK_EVENTS_QUEUE = process.env.RABBITMQ_CLICK_EVENTS_QUEUE || 'url_clicked_events_queue';

router.get('/:shortId', async (req: Request, res: Response, next: NextFunction) => {
  const { shortId } = req.params;

  // Basic validation for shortId
  if (!shortId || typeof shortId !== 'string' || shortId.length === 0 || shortId.length > 20) { 
    logger.warn('Redirect attempt with invalid or missing shortId format', { shortId });
    return res.status(400).type('text/plain').send('Invalid short URL format.');
  }

  logger.debug(`Redirect Service: Request for shortId: ${shortId}`);

  try {
    const redisClient = getRedisClient();
    const longUrl = await redisClient.get(`url:${shortId}`);

    if (longUrl) {
      logger.info(`Redirect Service: Redirecting ${shortId} to ${longUrl.substring(0,70)}...`);
      res.redirect(302, longUrl); 

      try {
        const publisher = getPublisherChannel();
        await publisher.assertQueue(CLICK_EVENTS_QUEUE, { durable: true }); 
        
        const clickEvent = {
          shortId: shortId,
          timestamp: new Date().toISOString(),
          // adding other relevant request details if needed for analytics
          // userAgent: req.headers['user-agent'],
          // referrer: req.headers['referer'],
        };

        const messageBuffer = Buffer.from(JSON.stringify(clickEvent));
        
        // Using ConfirmChannel, publish returns true on ACK, false on NACK/timeout
        const published = publisher.sendToQueue(
          CLICK_EVENTS_QUEUE,
          messageBuffer,
          { persistent: true }
        );

        if (published) {
            logger.debug('Redirect Service: Click event sent to RabbitMQ queue', { shortId });
        } else {
            logger.warn('Redirect Service: Click event publish to RabbitMQ failed (channel buffer full or NACKed immediately)', { shortId });
        }

      } catch (mqError) {
        logger.error('Redirect Service: Exception while trying to publish click event to RabbitMQ.', { 
            shortId, 
            error: mqError instanceof Error ? mqError.message : String(mqError) 
        });
      }
    } else {
      logger.warn(`Redirect Service: ShortId not found in Redis for redirection: ${shortId}`);
      res.status(404).type('text/plain').send('Short URL not found.');
    }
  } catch (error) {
    const err = error as Error;
    logger.error('Redirect Service: Critical error during redirection process.', { 
        shortId, 
        errorMessage: err.message,
        stack: err.stack
    });
    if (!res.headersSent) {
      res.status(500).type('text/plain').send('Error processing your request.');
    }
  }
});

export default router;