import { Request, Response, NextFunction } from 'express'; 
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { logger } from '../config/logger.js';
import { AuthService } from '../services/auth.service.js';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        logger.warn('Registration validation failed', { error: error.details[0].message, body: req.body });
        res.status(400).json({ message: error.details[0].message }); 
        return;
      }
      const user = await this.authService.registerUser(value);
      res.status(201).json({ message: 'User registered successfully.', user }); 
    } catch (err: any) {
      logger.error('Error during registration (to be caught by asyncHandler)', { error: err });
      if (err.message === 'Email already exists.') {
        res.status(409).json({ message: err.message });
      } else {
        next(err);
      }
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        logger.warn('Login validation failed', { error: error.details[0].message, body: req.body });
        res.status(400).json({ message: error.details[0].message });
        return;
      }
      const { token, user } = await this.authService.loginUser(value);
      res.status(200).json({ message: 'Login successful.', token, userId: user.id, email: user.email, username: user.username });
    } catch (err: any) {
      logger.error('Error during login (to be caught by asyncHandler)', { error: err });
      if (err.message === 'Invalid email or password.') {
        res.status(401).json({ message: err.message });
      } else if (err.message && err.message.includes('JWT_SECRET')) {
        res.status(500).json({ message: err.message });
      } else {
        next(err);
      }
    }
  };
}