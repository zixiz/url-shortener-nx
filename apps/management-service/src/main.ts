import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source.js'; 
import { logger } from './config/logger.js';    
import { connectRabbitMQ } from './config/rabbitmq.js'; 
import { connectRedis } from './config/redis.js';
import authRoutes from './routes/auth.routes.js';
import urlRoutes from './routes/url.routes.js';
import statsRoutes from './routes/stats.routes.js';
import { startClickEventConsumer } from './rabbitmq-click-consumer.js'; 

async function bootstrap() {
  const app = express();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  logger.info(`CORS enabled for origin: [${frontendUrl}]`); 

  app.use(cors({
    origin: frontendUrl, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization'], 
    credentials: true, 
  }));

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
    await startClickEventConsumer(); 
    logger.info('Management Service: Click event consumer started successfully.');
  } catch (error) {
    logger.error('Management Service: Error starting click event consumer', error);
  }

  try {
    connectRedis();
    logger.info('Management Service: Redis client initialized.');
  } catch (error) {
    logger.error('Management Service: Error initializing Redis client', error);
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/urls', urlRoutes);
  app.use('/api', statsRoutes);

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    logger.info(`Management service listening at http://localhost:${port}`);
  });
}
bootstrap();