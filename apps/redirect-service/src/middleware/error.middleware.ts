import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * A generic, catch-all error handling middleware.
 * It should be the last middleware added to the Express app.
 */
export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // If headers are already sent, delegate to the default Express error handler.
  if (res.headersSent) {
    return next(err);
  }

  const anyErr = err as any;

  // Validation error handling (e.g., invalid shortId)
  if (anyErr?.isJoi === true || err.name === 'ValidationError' || /Invalid short URL format/i.test(err.message)) {
    logger.warn('Validation error in redirect-service.', {
      path: req.path,
      method: req.method,
      service: 'redirect-service'
    });

    const notFoundUrl = process.env.WEB_APP_NOT_FOUND_URL || 'http://localhost:4200/404';
    return res.redirect(302, notFoundUrl);
  }

  // Unexpected errors → log with stack and return standardized 500
  logger.error('An unhandled error occurred in the application.', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    service: 'redirect-service'
  });

  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' }
  });
};