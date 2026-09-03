import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization header with Bearer token is required.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role?: string };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired JWT token.' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Administrator privileges are required to perform this action.',
    });
    return;
  }
  next();
}

export function requireAdminOrManager(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || !['admin', 'manager'].includes(req.user.role || '')) {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Administrator or Manager privileges are required to perform this action.',
    });
    return;
  }
  next();
}
