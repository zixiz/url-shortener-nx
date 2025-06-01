import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { logger } from './config/logger.js';     // Will create this
import { connectRedis } from './config/redis.js'; // Will create this
import { startRabbitMQConsumer } from './rabbitmq-consumer.js'; // Will create this

// Redirect route will be imported here

async function bootstrap() {
  const app = express();
  // No express.json() needed if it only handles GET /{shortId}

  try {
    connectRedis();
    logger.info('Redirect Service: Redis client initialized.');
  } catch (error) {
    logger.error('Redirect Service: Error initializing Redis client', error);
    process.exit(1); // Redis is critical for this service
  }

  try {
    await startRabbitMQConsumer(); // Connects to RabbitMQ and starts listening
    logger.info('Redirect Service: RabbitMQ consumer started.');
  } catch (error) {
    logger.error('Redirect Service: Error starting RabbitMQ consumer', error);
    // Decide if this is critical enough to exit
  }

  // app.get('/:shortId', redirectHandler);

  const port = process.env.PORT || 3003;
  app.listen(port, () => {
    logger.info(`Redirect service listening at http://localhost:${port}`);
  });
}
bootstrap();