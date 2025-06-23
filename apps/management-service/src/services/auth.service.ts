import { AppDataSource } from '../data-source.js';
import { User } from '../entities/user.entity.js';
import jwt, { SignOptions } from 'jsonwebtoken';
import { logger } from '../config/logger.js';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async registerUser(data: { email: string; password: string; username?: string }): Promise<Omit<User, 'password'>> {
    const { email, password, username } = data;
    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email });
      throw new Error('Email already exists.');
    }
    const user = new User();
    user.email = email;
    user.password = password;
    if (username) user.username = username;
    await this.userRepository.save(user);
    logger.info('User registered successfully', { userId: user.id, email: user.email });
    const userWithoutPassword = Object.assign(Object.create(Object.getPrototypeOf(user)), user);
    delete userWithoutPassword.password;
    return userWithoutPassword;
  }

  async loginUser(data: { email: string; password: string }): Promise<{ token: string; user: Omit<User, 'password'> }> {
    const { email, password } = data;
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      logger.warn('Login attempt for non-existent user', { email });
      throw new Error('Invalid email or password.');
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', { email });
      throw new Error('Invalid email or password.');
    }
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresInRaw = process.env.JWT_EXPIRES_IN;
    if (!jwtSecret) {
      logger.error('JWT_SECRET is not defined in environment variables.');
      throw new Error('JWT_SECRET is not defined. Server configuration error.');
    }
    const signOptions: SignOptions = {};
    if (jwtExpiresInRaw) {
      const expiresInSeconds = parseInt(jwtExpiresInRaw, 10);
      signOptions.expiresIn = !isNaN(expiresInSeconds) ? expiresInSeconds : 3600;
    } else {
      signOptions.expiresIn = 3600;
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      jwtSecret,
      signOptions
    );
    logger.info('User logged in successfully', { userId: user.id, email: user.email });
    const userWithoutPassword = Object.assign(Object.create(Object.getPrototypeOf(user)), user);
    delete userWithoutPassword.password;
    return { token, user: userWithoutPassword };
  }
} 