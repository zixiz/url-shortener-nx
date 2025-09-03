import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AppDataSource } from '../data-source.js';
import { User } from '../entities/user.entity.js';
import { logger } from '../config/logger.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const tokenParts = authHeader.split(' '); // Expect "Bearer TOKEN"

    if (tokenParts.length === 2 && tokenParts[0].toLowerCase() === 'bearer') {
      const token = tokenParts[1];
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        logger.error('JWT_SECRET is not defined for token verification.');
        res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' } });
        return;
      }

      try {
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOneBy({ id: decoded.id });

        if (!user) {
          logger.warn('JWT valid, but user not found in DB.', { userId: decoded.id });
          res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } });
          return;
        }

        const userPayload = { ...user };
        delete (userPayload as any).password;

        req.user = userPayload as User;
        logger.debug('User authenticated via JWT', { userId: user.id });
        next();
      } catch (err) {
        logger.warn('JWT verification failed.', {
          error: err instanceof Error ? err.message : String(err),
          tokenProvided: token ? 'yes' : 'no',
        });
        if (err instanceof jwt.TokenExpiredError) {
          res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token expired' } });
        } else if (err instanceof jwt.JsonWebTokenError) {
          res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
        } else {
          res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
        }
      }
    } else {
      logger.warn('Malformed Authorization header (not Bearer token).', { header: authHeader });
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Malformed token' } });
    }
  } else {
    logger.debug('No Authorization header found for protected route.');
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
  }
};

export const optionalAuthenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length === 2 && tokenParts[0].toLowerCase() === 'bearer') {
      const token = tokenParts[1];
      const jwtSecret = process.env.JWT_SECRET;

      if (jwtSecret) {
        try {
          const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
          const userRepository = AppDataSource.getRepository(User);
          const user = await userRepository.findOneBy({ id: decoded.id });
          if (user) {
            const userPayload = { ...user };
            delete (userPayload as any).password;
            req.user = userPayload as User;
          }
        } catch (err) {
          logger.debug('Optional JWT verification failed, proceeding as anonymous.', {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }
  }
  next();
};