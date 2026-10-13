import { Router } from 'express';
import { register, login, logout, getMe } from '../../controllers/auth.controller.js';
import { authenticateJWT } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateJWT, getMe);

export default router;
