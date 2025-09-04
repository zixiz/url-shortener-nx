/**
 * Service layer for URL-related business logic.
 * Handles shortId generation, collision checks, DB operations, and RabbitMQ publishing.
 */
import { AppDataSource } from '../data-source.js';
import { Url } from '../entities/url.entity.js';
import { nanoid } from 'nanoid';
import { getRabbitMQChannel } from '../config/rabbitmq.js';
import { logger } from '../config/logger.js';
import { ConflictError } from '../errors/ConflictError.js';

const SHORT_ID_LENGTH = 11;
const RABBITMQ_NEW_URL_QUEUE = process.env.RABBITMQ_NEW_URL_QUEUE || 'new_url_queue';
const RABBITMQ_URL_DELETED_QUEUE = process.env.RABBITMQ_URL_DELETED_QUEUE || 'url_deleted_queue';

export type DeleteUrlResult = 'SUCCESS' | 'NOT_FOUND' | 'FORBIDDEN';

export class UrlService {
  private urlRepository = AppDataSource.getRepository(Url);

  /**
   * Creates a new short URL mapping.
   * Generates a unique shortId, saves to DB, and publishes to RabbitMQ.
   */
  async createShortUrl(longUrl: string, userId: string | null): Promise<Url> {
    let shortId: string | null = null;
    const MAX_SHORT_ID_ATTEMPTS = 3;
    for (let i = 0; i < MAX_SHORT_ID_ATTEMPTS; i++) {
      const candidate = nanoid(SHORT_ID_LENGTH);
      const exists = await this.urlRepository.exists({ where: { shortId: candidate } });
      if (!exists) {
        shortId = candidate;
        break;
      }
    }
  
    if (!shortId) {
      throw new ConflictError('Code already in use, try again');
    }
  
    const newUrl = this.urlRepository.create({ longUrl, shortId, userId });
    await this.urlRepository.save(newUrl);
    await this.publishNewUrlToQueue(shortId, longUrl);
  
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

  /**
   * Deletes a URL, checking for ownership.
   */
  async deleteUrl(shortId: string, userId: string): Promise<DeleteUrlResult> {
    const urlToDelete = await this.urlRepository.findOne({ where: { shortId } });

    if (!urlToDelete) {
      logger.warn('Delete attempt for a URL that does not exist.', { shortId, userId });
      return 'NOT_FOUND';
    }

    if (urlToDelete.userId !== userId) {
      logger.warn('Permission denied. User attempted to delete a URL they do not own.', { 
        shortId, 
        ownerUserId: urlToDelete.userId, 
        attemptedUserId: userId 
      });
      return 'FORBIDDEN';
    }

    await this.urlRepository.remove(urlToDelete);
    logger.info('Successfully deleted URL from database.', { shortId, userId });
    this.publishUrlDeletedToQueue(shortId).catch(err => {
        logger.error('Failed to publish URL deletion event after successful deletion.', {error: err.message});
    });

    return 'SUCCESS';
  }

  /**
   * Publishes a message to RabbitMQ to signify that a URL has been deleted.
   */
  private async publishUrlDeletedToQueue(shortId: string): Promise<void> {
    try {
      const channel = getRabbitMQChannel();
      await channel.assertQueue(RABBITMQ_URL_DELETED_QUEUE, { durable: true });
      channel.sendToQueue(
        RABBITMQ_URL_DELETED_QUEUE,
        Buffer.from(JSON.stringify({ shortId })),
        { persistent: true }
      );
      logger.info('Published URL deletion event to RabbitMQ', { shortId });
    } catch (mqError) {
      logger.error('Failed to publish URL deletion event to RabbitMQ.', {
        shortId,
        error: mqError instanceof Error ? mqError.message : String(mqError),
      });
      throw mqError;
    }
  }
} 