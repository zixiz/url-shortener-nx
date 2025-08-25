import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source.js'; 
import { logger } from './config/logger.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import authRoutes from './routes/auth.routes.js';
import urlRoutes from './routes/url.routes.js';
import statsRoutes from './routes/stats.routes.js';
import { startClickEventConsumer } from './rabbitmq-click-consumer.js'; 
import { setupSwagger } from './swagger.js';
import { globalErrorHandler } from './middleware/error.middleware.js';

async function connectToDatabaseWithRetry(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      logger.info('Management Service: Database connected successfully.');
      return;
    } catch (error: any) {
      logger.error(`Management Service: Error connecting to DB (attempt ${i + 1}/${retries})`, { 
        errorMessage: error.message, 
        errorCode: error.code, 
        errorStack: error.stack,
        service: "management-service"
      });
      if (i === retries - 1) {
        logger.error('Management Service: Max DB connection retries reached. Exiting.');
        throw error; 
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

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
    await connectToDatabaseWithRetry();

    logger.info('Management Service: Running database migrations...');
    await AppDataSource.runMigrations();
    logger.info('Management Service: Database migrations completed successfully.');

  } catch (dbError) {
    logger.error('Management Service: FAILED TO INITIALIZE OR MIGRATE DATABASE. EXITING.');
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

  app.use('/api/auth', authRoutes);
  app.use('/api/urls', urlRoutes);
  app.use('/api', statsRoutes);

  setupSwagger(app);

  // Global error handler must be the last middleware
  app.use(globalErrorHandler);

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    logger.info(`Management service listening at http://localhost:${port}`);
  });
}
bootstrap();