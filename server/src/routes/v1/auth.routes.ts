import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../../utils/db';
import { signToken } from '../../utils/jwt';
import { authenticateJwt, AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const users = await query<any[]>('SELECT * FROM User WHERE email = ? LIMIT 1', [cleanEmail]);

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = signToken({ userId: user.id, email: user.email });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process login request',
    });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const users = await query<any[]>('SELECT id, email, name, createdAt FROM User WHERE id = ? LIMIT 1', [userId]);

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: { user: users[0] },
    });
  } catch (error: any) {
    console.error('Fetch me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
    });
  }
});

export default router;
