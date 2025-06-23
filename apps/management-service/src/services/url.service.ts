/**
 * Service layer for URL-related business logic.
 * Handles shortId generation, collision checks, DB operations, and RabbitMQ publishing.
 */
import { AppDataSource } from '../data-source.js';
import { Url } from '../entities/url.entity.js';
import { nanoid } from 'nanoid';
import { getRabbitMQChannel } from '../config/rabbitmq.js';
import { logger } from '../config/logger.js';

const SHORT_ID_LENGTH = 11;
const RABBITMQ_NEW_URL_QUEUE = process.env.RABBITMQ_NEW_URL_QUEUE || 'new_url_queue';

export class UrlService {
  private urlRepository = AppDataSource.getRepository(Url);

  /**
   * Creates a new short URL, ensuring uniqueness, and publishes to RabbitMQ.
   */
  async createShortUrl(longUrl: string, userId: string | null): Promise<Url> {
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
        throw new Error('Could not generate a unique short ID. Please try again.');
      }
    } while (existingUrl);

    const newUrl = new Url();
    newUrl.longUrl = longUrl;
    newUrl.shortId = shortId;
    newUrl.userId = userId;

    await this.urlRepository.save(newUrl);
    await this.publishNewUrlToQueue(newUrl.shortId, newUrl.longUrl);
    return newUrl;
  }

  /**
   * Publishes the new URL mapping to RabbitMQ.
   */
  private async publishNewUrlToQueue(shortId: string, longUrl: string): Promise<void> {
    try {
      const channel = getRabbitMQChannel();
      await channel.assertQueue(RABBITMQ_NEW_URL_QUEUE, { durable: true });
      channel.sendToQueue(
        RABBITMQ_NEW_URL_QUEUE,
        Buffer.from(JSON.stringify({ shortId, longUrl })),
        { persistent: true }
      );
      logger.info('Published new URL mapping to RabbitMQ', { shortId });
    } catch (mqError) {
      logger.error('Failed to publish URL mapping to RabbitMQ. URL still created.', {
        shortId,
        error: mqError instanceof Error ? mqError.message : String(mqError)
      });
    }
  }

  /**
   * Lists all URLs for a given user.
   */
  async listMyUrls(userId: string): Promise<Url[]> {
    return this.urlRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Gets stats for a given shortId, but only if it belongs to the given userId.
   */
  async getUrlStats(shortId: string, userId: string): Promise<Url | null> {
    return this.urlRepository.findOneBy({ shortId, userId });
  }
} 