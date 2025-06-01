import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { AppDataSource } from './data-source.js'; 
import { logger } from './config/logger.js';    
import { connectRabbitMQ } from './config/rabbitmq.js'; 
import { connectRedis } from './config/redis.js';
import authRoutes from './routes/auth.routes.js';
import urlRoutes from './routes/url.routes.js';
import statsRoutes from './routes/stats.routes.js';

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

  app.use('/api/auth', authRoutes);
  app.use('/api/urls', urlRoutes);
  app.use('/api/stats', statsRoutes);

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    logger.info(`Management service listening at http://localhost:${port}`);
  });
}
bootstrap();