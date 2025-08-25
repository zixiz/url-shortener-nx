import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

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
    service: 'redirect-service'
  });

  // Avoid sending stack trace to client in production
  const response = {
    message: 'An unexpected error occurred. We have been notified and are working on a fix.'
  };

  // If headers are already sent, delegate to the default Express error handler.
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json(response);
};