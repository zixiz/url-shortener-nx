import { Router } from 'express';
import { UrlController } from '../controllers/url.controller.js';
import { authenticateJWT, optionalAuthenticateJWT } from '../middleware/auth.middleware.js'; 

const router = Router();
const urlController = new UrlController();

// POST /api/urls - Create a new short URL (authentication optional)
router.post('/', optionalAuthenticateJWT, urlController.createShortUrl); 

// GET /api/urls/mine - List URLs for authenticated user (authentication required)
router.get('/mine', authenticateJWT, urlController.listMyUrls);


export default router;