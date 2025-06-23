import { Router } from 'express';
import { UrlController } from '../controllers/url.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();
const urlController = new UrlController(); 

router.get('/stats/:shortId', authenticateJWT, urlController.getUrlStats);

export default router;