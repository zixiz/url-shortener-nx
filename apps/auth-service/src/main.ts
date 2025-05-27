import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { AppDataSource } from './data-source.js'; 
import { logger } from './config/logger.js';
// import authRoutes from './routes/auth.routes.js';

async function bootstrap() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  try {
    await AppDataSource.initialize(); 
    logger.info('Database connected successfully.');
  } catch (error) {
    logger.error('Error connecting to the database', error);
    process.exit(1);
  }

  // app.use('/api/auth', authRoutes);

  const port = process.env.PORT || 3001;
  const server = app.listen(port, () => {
    logger.info(`Auth service listening at http://localhost:${port}`);
  });

  server.on('error', (error) => {
    logger.error('Server error', error);
  });
}

bootstrap();