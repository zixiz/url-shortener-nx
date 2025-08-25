import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { logger } from './config/logger.js';
import { connectRedis } from './config/redis.js';
import { startRabbitMQ  } from './rabbitmq-consumer.js';
import redirectRoutes from './routes/redirect.routes.js';
import { setupSwagger } from './swagger.js';
import { globalErrorHandler } from './middleware/error.middleware.js';

async function bootstrap() {
  const app = express();

  try {
    connectRedis();
    logger.info('Redirect Service: Redis client initialized.');
  } catch (error) {
    logger.error('Redirect Service: Error initializing Redis client', error);
    process.exit(1); 
  }

  try {
    await startRabbitMQ (); 
    logger.info('Redirect Service: RabbitMQ consumer started.');
  } catch (error) {
    logger.error('Redirect Service: Error starting RabbitMQ consumer', error);
  }

  setupSwagger(app);

  app.use('/', redirectRoutes);

  // Global error handler must be the last middleware
  app.use(globalErrorHandler);
  
  const port = process.env.PORT || 3003;
  app.listen(port, () => {
    logger.info(`Redirect service listening at http://localhost:${port}`);
  });
}
bootstrap();