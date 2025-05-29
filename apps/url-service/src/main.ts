// apps/url-service/src/main.ts
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { AppDataSource } from './data-source.js'; // We'll create this
import { logger } from './config/logger.js';     // We'll create this
import { connectRabbitMQ, getRabbitMQChannel } from './config/rabbitmq.js'; // We'll create this
// Import routes (we'll create these later)
// import urlRoutes from './routes/url.routes.js';

async function bootstrap() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize TypeORM connection for URL service
  try {
    await AppDataSource.initialize();
    logger.info('URL Service: Database connected successfully.');
  } catch (error) {
    logger.error('URL Service: Error connecting to the database', error);
    process.exit(1);
  }

  // Connect to RabbitMQ
  try {
    await connectRabbitMQ();
    logger.info('URL Service: Connected to RabbitMQ successfully.');
    // You can get the channel here if needed globally, or get it on-demand in services/controllers
    // const channel = getRabbitMQChannel();
    // Example: Declare a queue if it doesn't exist (usually done by consumers or upon first message)
    // await channel.assertQueue('url_events', { durable: true });
  } catch (error) {
    logger.error('URL Service: Error connecting to RabbitMQ', error);
    // Decide if RabbitMQ connection failure is critical enough to exit
    // For now, we'll log and continue, endpoints might fail if they rely on it.
    // process.exit(1);
  }

  // API Routes
  // app.use('/api/urls', urlRoutes);
  // app.use('/api/stats', urlRoutes); // Or separate stats routes

  const port = process.env.PORT || 3002;
  const server = app.listen(port, () => {
    logger.info(`URL service listening at http://localhost:${port}`);
  });

  server.on('error', (error) => {
    logger.error('URL Service: Server error', error);
  });
}

bootstrap();