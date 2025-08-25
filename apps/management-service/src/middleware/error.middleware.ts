import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

/**
 * A generic, catch-all error handling middleware.
 * It should be the last middleware added to the Express app.
 */
export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('An unhandled error occurred in the application.', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    service: 'management-service'
  });

  // Avoid sending stack trace to client in production
  const response = {
    message: 'Internal Server Error. Please try again later.'
  };

  res.status(500).json(response);
};