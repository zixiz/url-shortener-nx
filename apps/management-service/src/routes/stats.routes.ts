import { Router } from 'express';
import { UrlController } from '../controllers/url.controller.js';

const router = Router();
const urlController = new UrlController(); // May need to share instance or make controller methods static

// GET /api/stats/:shortId - Publicly view click count
router.get('/stats/:shortId', urlController.getUrlStats);

export default router;