import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { ConflictError } from '../errors/ConflictError.js';

/**
 * A generic, catch-all error handling middleware.
 * It should be the last middleware added to the Express app.
 */
export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // 409 Conflict (e.g., short code collision exhausts attempts)
  if (err instanceof ConflictError) {
    logger.warn('Conflict encountered while processing request.', {
      path: req.path,
      method: req.method,
      service: 'management-service'
    });
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'Code already in use, try again' }
    });
  }

  // 400 Validation error (e.g., Joi validators)
  const anyErr = err as any;
  if (anyErr?.isJoi === true || err.name === 'ValidationError') {
    logger.warn('Validation error while processing request.', {
      path: req.path,
      method: req.method,
      service: 'management-service'
    });
    const message = anyErr?.details?.[0]?.message || 'Invalid request data';
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message }
    });
  }

  // Avoid sending stack trace to client in production
  logger.error('An unhandled error occurred in the application.', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    service: 'management-service'
  });

  const response = {
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' }
  } as const;

  res.status(500).json(response);
};