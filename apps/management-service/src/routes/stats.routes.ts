import { Router } from 'express';
import { UrlController } from '../controllers/url.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();
const urlController = new UrlController(); 

const statsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 25, // limit each IP to 20 requests per windowMs
  message: { error: 'Too many requests for stats, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @preserve
 * @swagger
 * tags:
 *   name: Stats
 *   description: URL statistics and analytics
 */

/**
 * @preserve
 * @swagger
 * components:
 *   schemas:
 *     UrlStats:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique ID of the URL entity.
 *         shortId:
 *           type: string
 *           description: The short identifier for the URL.
 *         originalUrl:
 *           type: string
 *           description: The original, long URL.
 *         clicks:
 *           type: integer
 *           description: The total number of clicks.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the URL was shortened.
 */

/**
 * @preserve
 * @swagger
 * /api/stats/{shortId}:
 *   get:
 *     summary: Get statistics for a specific shortened URL
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shortId
 *         schema:
 *           type: string
 *         required: true
 *         description: The short ID of the URL to retrieve stats for.
 *     responses:
 *       '200':
 *         description: Successfully retrieved URL statistics.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UrlStats'
 *       '401':
 *         description: Unauthorized (token is missing or invalid).
 *       '403':
 *         description: Forbidden (user does not have permission to view these stats).
 *       '404':
 *         description: URL not found.
 */
router.get('/stats/:shortId', statsLimiter, authenticateJWT, urlController.getUrlStats);

export default router;