import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { AppDataSource } from './data-source.js'; // Will create this
import { logger } from './config/logger.js';     // Will create this
import { connectRabbitMQ } from './config/rabbitmq.js'; // Will create this
import { connectRedis } from './config/redis.js'; // Will create this

// Auth and URL routes will be imported here later

async function bootstrap() {
  const app = express();
  app.use(express.json());

  try {
    await AppDataSource.initialize();
    logger.info('Management Service: Database connected successfully.');
  } catch (error) {
    logger.error('Management Service: Error connecting to the database', error);
    process.exit(1);
  }

  try {
    await connectRabbitMQ();
    logger.info('Management Service: Connected to RabbitMQ successfully.');
  } catch (error) {
    logger.error('Management Service: Error connecting to RabbitMQ', error);
  }

  try {
    connectRedis(); // connectRedis usually doesn't need await if it's just creating a client instance
    logger.info('Management Service: Redis client initialized.');
  } catch (error) {
    logger.error('Management Service: Error initializing Redis client', error);
  }

  // app.use('/api/auth', authRoutes);
  // app.use('/api/urls', urlRoutes);
  // app.use('/api/stats', statsRoutes);

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    logger.info(`Management service listening at http://localhost:${port}`);
  });
}
bootstrap();