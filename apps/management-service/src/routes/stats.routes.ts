import { Router } from 'express';
import { UrlController } from '../controllers/url.controller.js';

const router = Router();
const urlController = new UrlController(); 

router.get('/stats/:shortId', urlController.getUrlStats);

export default router;