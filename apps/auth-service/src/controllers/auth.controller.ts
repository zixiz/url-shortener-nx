// apps\auth-service\src\controllers\auth.controller.ts
import { Request, Response, NextFunction } from 'express'; // Ensure NextFunction is imported
import { AppDataSource } from '../data-source.js';
import { User } from '../entities/user.entity.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import jwt, { SignOptions } from 'jsonwebtoken';
import { logger } from '../config/logger.js';

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // ^-- Return Promise<void> because if successful, we send a response.
    // If error, asyncHandler calls next(err). We don't explicitly return a Response in the error path handled by next.
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        logger.warn('Registration validation failed', { error: error.details[0].message, body: req.body });
        res.status(400).json({ message: error.details[0].message }); // Send response
        return;
      }

      
      const { email, password, username } = value;
      
      const existingUser = await this.userRepository.findOneBy({ email });
      if (existingUser) {
        logger.warn('Registration attempt with existing email', { email });
        res.status(409).json({ message: 'Email already exists.' }); // Send response
        return;
      }

      const user = new User();
      user.email = email;
      user.password = password;
      if (username) {
        user.username = username;
      }

      await this.userRepository.save(user);
      logger.info('User registered successfully', { userId: user.id, email: user.email });

      const userResponse = { ...user };
      delete (userResponse as any).password;

      res.status(201).json({ message: 'User registered successfully.', user: userResponse }); // Send response
    } catch (err) {
      logger.error('Error during registration (to be caught by asyncHandler)', { error: err });
      next(err); // Pass error to asyncHandler/Express error handling
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

      const { email, password } = value;

      const user = await this.userRepository.findOneBy({ email });
      if (!user) {
        logger.warn('Login attempt for non-existent user', { email });
        res.status(401).json({ message: 'Invalid email or password.' });
        return;
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        logger.warn('Login attempt with invalid password', { email });
        res.status(401).json({ message: 'Invalid email or password.' });
        return;
      }

      const jwtSecret = process.env.JWT_SECRET;
      const jwtExpiresInRaw = process.env.JWT_EXPIRES_IN;

      if (!jwtSecret) {
        logger.error('JWT_SECRET is not defined in environment variables.');
        // This is a server configuration error. Pass to error handler.
        return next(new Error('JWT_SECRET is not defined. Server configuration error.'));
      }

      const signOptions: SignOptions = {};
        if (jwtExpiresInRaw) {
            const expiresInSeconds = parseInt(jwtExpiresInRaw, 10);
            if (!isNaN(expiresInSeconds)) {
            signOptions.expiresIn = expiresInSeconds;
            } else {
            logger.warn(`Invalid JWT_EXPIRES_IN value: ${jwtExpiresInRaw}. Defaulting to 1 hour (3600s).`);
            signOptions.expiresIn = 3600;
            }
        } else {
            signOptions.expiresIn = 3600;
        }


      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        jwtSecret,
        signOptions
      );

      logger.info('User logged in successfully', { userId: user.id, email: user.email });
      res.status(200).json({ message: 'Login successful.', token, userId: user.id, email: user.email, username: user.username });
    } catch (err) {
      logger.error('Error during login (to be caught by asyncHandler)', { error: err });
      next(err); // Pass error to asyncHandler/Express error handling
    }
  };
}