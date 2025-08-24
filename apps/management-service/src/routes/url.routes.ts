import { Router } from 'express';
import { UrlController } from '../controllers/url.controller.js';
import { authenticateJWT, optionalAuthenticateJWT } from '../middleware/auth.middleware.js'; 
import rateLimit from 'express-rate-limit';

const router = Router();
const urlController = new UrlController();

/**
 * @preserve
 * @swagger
 * tags:
 *   name: URLs
 *   description: URL shortening and management
 */

/**
 * @preserve
 * @swagger
 * components:
 *   schemas:
 *     Url:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         shortId:
 *           type: string
 *         originalUrl:
 *           type: string
 *         clicks:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         userId:
 *           type: string
 *           nullable: true
 *     ShortenUrlRequest:
 *       type: object
 *       required:
 *         - originalUrl
 *       properties:
 *         originalUrl:
 *           type: string
 *           format: uri
 *           description: The URL to shorten.
 *           example: 'https://www.google.com'
 *     ShortenUrlResponse:
 *       type: object
 *       properties:
 *         shortId:
 *           type: string
 *           description: The generated short ID.
 *           example: 'abcde12'
 *         originalUrl:
 *           type: string
 *           description: The original URL that was shortened.
 *           example: 'https://www.google.com'
 */

// Rate limiter for URL shortening (10 requests per minute per IP)
const urlShortenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @preserve
 * @swagger
 * /api/urls:
 *   post:
 *     summary: Create a new short URL
 *     tags: [URLs]
 *     description: Creates a short URL. Authentication is optional. If authenticated, the URL will be associated with the user. If not, it will be an anonymous URL.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShortenUrlRequest'
 *     responses:
 *       '201':
 *         description: URL created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShortenUrlResponse'
 *       '400':
 *         description: Bad request (e.g., invalid URL).
 *       '429':
 *         description: Too many requests from this IP.
 */
router.post('/', urlShortenLimiter, optionalAuthenticateJWT, urlController.createShortUrl); 

/**
 * @preserve
 * @swagger
 * /api/urls/mine:
 *   get:
 *     summary: List all URLs for the authenticated user
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of URLs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Url'
 *       '401':
 *         description: Unauthorized.
 */
router.get('/mine', authenticateJWT, urlController.listMyUrls);

/**
 * @preserve
 * @swagger
 * /api/urls/{shortId}:
 *   delete:
 *     summary: Delete a shortened URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shortId
 *         schema:
 *           type: string
 *         required: true
 *         description: The short ID of the URL to delete.
 *     responses:
 *       '204':
 *         description: URL deleted successfully.
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden (user does not own this URL).
 *       '404':
 *         description: URL not found.
 */
router.delete('/:shortId', authenticateJWT, urlController.deleteUrl);


export default router;
