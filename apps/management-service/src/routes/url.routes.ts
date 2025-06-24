import { Router } from 'express';
import { UrlController } from '../controllers/url.controller.js';
import { authenticateJWT, optionalAuthenticateJWT } from '../middleware/auth.middleware.js'; 
import rateLimit from 'express-rate-limit';

const router = Router();
const urlController = new UrlController();

// Rate limiter for URL shortening (10 requests per minute per IP)
const urlShortenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/urls - Create a new short URL (authentication optional)
router.post('/', urlShortenLimiter, optionalAuthenticateJWT, urlController.createShortUrl); 

// GET /api/urls/mine - List URLs for authenticated user (authentication required)
router.get('/mine', authenticateJWT, urlController.listMyUrls);


export default router;