import { Router } from 'express';
import { signup, login, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);

export default router;