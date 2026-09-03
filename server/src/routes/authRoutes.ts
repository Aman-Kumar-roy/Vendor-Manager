import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authMiddleware as any, AuthController.getMe as any);

// User Management Routes (Deletion restricted strictly to Administrator role)
router.post('/users', authMiddleware as any, requireAdmin as any, AuthController.createUser as any);
router.get('/users', authMiddleware as any, AuthController.getUsers as any);
router.delete('/users/:id', authMiddleware as any, requireAdmin as any, AuthController.deleteUser as any);

export default router;
