import { Router } from 'express';
import { RedirectController } from '../controllers/redirect.controller';

const router = Router();

const redirectController = new RedirectController();

router.get('/:shortId', redirectController.handleRedirect);

export default router;