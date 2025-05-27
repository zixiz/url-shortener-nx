// apps/auth-service/src/main.ts
import 'reflect-metadata'; // Must be the first import for TypeORM
import * as dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express from 'express';
// import * as path from 'path'; // Nx might include this, often not needed with ESM __dirname workarounds
// import { AppDataSource } from './data-source.js'; 
import { logger } from './config/logger.js';
// Import routes (we'll create these later)
// import authRoutes from './routes/auth.routes.js'; // <--- Added .js

// For __dirname in ES Modules if needed (though often not required with proper path handling)
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

async function bootstrap() {
  const app = express();

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize TypeORM connection
  // try {
  //   await AppDataSource.initialize();
  //   logger.info('Database connected successfully.');
  // } catch (error) {
  //   logger.error('Error connecting to the database', error);
  //   process.exit(1);
  // }

  // API Routes
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