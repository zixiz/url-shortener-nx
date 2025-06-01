import { Router } from 'express';
import { UrlController } from '../controllers/url.controller.js';
import { authenticateJWT, optionalAuthenticateJWT } from '../middleware/auth.middleware.js'; 

const router = Router();
const urlController = new UrlController();

// POST /api/urls - Create short URL (optional authentication)
// We need a new middleware 'optionalAuthenticateJWT' that tries to auth but doesn't fail if no token
router.post('/', optionalAuthenticateJWT, urlController.createShortUrl); // Placeholder for optional auth

// GET /api/urls/mine - List URLs for authenticated user (authentication required)
router.get('/mine', authenticateJWT, urlController.listMyUrls);

// GET /api/stats/:shortId - Publicly view click count
router.get('/stats/:shortId', urlController.getUrlStats);


export default router;