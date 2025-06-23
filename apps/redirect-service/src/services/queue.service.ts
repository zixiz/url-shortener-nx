/**
 * Service for publishing click events to RabbitMQ.
 * This function is fire-and-forget and should not block the main HTTP response.
 */
import { getPublisherChannel } from '../rabbitmq-consumer.js';
import { logger } from '../config/logger.js';
import { ClickEvent } from '../types/events';

const CLICK_EVENTS_QUEUE = process.env.RABBITMQ_CLICK_EVENTS_QUEUE || 'url_clicked_events_queue';

/**
 * Publishes a click event to the RabbitMQ queue asynchronously.
 * @param event - The click event payload.
 */
export async function publishClickEvent(event: ClickEvent): Promise<void> {
  const publisher = getPublisherChannel();
  await publisher.assertQueue(CLICK_EVENTS_QUEUE, { durable: true });

  const messageBuffer = Buffer.from(JSON.stringify(event));

  const published = publisher.sendToQueue(
    CLICK_EVENTS_QUEUE,
    messageBuffer,
    { persistent: true }
  );

  if (published) {
    logger.debug('Redirect Service: Click event sent to RabbitMQ queue', { shortId: event.shortId });
  } else {
    logger.warn('Redirect Service: Click event publish to RabbitMQ failed (channel buffer full or NACKed immediately)', { shortId: event.shortId });
  }
} 