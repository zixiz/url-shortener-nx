import { Router } from 'express';
import { RedirectController } from '../controllers/redirect.controller';
import rateLimit from 'express-rate-limit';

const router = Router();

const redirectController = new RedirectController();

const redirectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // limit each IP to 50 requests per windowMs
  message: { error: 'Too many redirect requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @preserve
 * @swagger
 * tags:
 *   name: Redirect
 *   description: The core URL redirection endpoint.
 */

/**
 * @preserve
 * @swagger
 * /{shortId}:
 *   get:
 *     summary: Redirects a short URL to its original destination.
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: shortId
 *         schema:
 *           type: string
 *         required: true
 *         description: The short ID to redirect.
 *         example: 'abcde12'
 *     responses:
 *       '302':
 *         description: Found. The user will be redirected to the original URL.
 *       '404':
 *         description: The short URL was not found.
 */
router.get('/:shortId', redirectLimiter, redirectController.handleRedirect);

export default router;