import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js'; 
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.middleware.js'; 

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', authenticateJWT, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized (user not found on request after auth).' });
  }
  return res.status(200).json(req.user);
});

export default router;