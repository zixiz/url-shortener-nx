import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js'; 
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.middleware.js'; 
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many login attempts from this IP, please try again after 5 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @preserve
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and registration
 */

/**
 * @preserve
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The user ID.
 *           example: '123e4567-e89b-12d3-a456-426614174000'
 *         username:
 *           type: string
 *           description: The user's username.
 *           example: 'johndoe'
 *         email:
 *           type: string
 *           description: The user's email.
 *           example: 'johndoe@example.com'
 */

/**
 * @preserve
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       '201':
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '409':
 *         description: User with that email or username already exists
 *       '400':
 *         description: Bad request (e.g., validation error)
 */
router.post('/register', authLimiter, authController.register);

/**
 * @preserve
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Logs in a user and returns a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       '200':
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *       '401':
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, authController.login);

/**
 * @preserve
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the profile of the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: The user's profile
 *         content:
- *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '401':
 *         description: Unauthorized (token is missing or invalid)
 */
router.get('/me', authenticateJWT, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized (user not found on request after auth).' });
  }
  return res.status(200).json(req.user);
});

export default router;