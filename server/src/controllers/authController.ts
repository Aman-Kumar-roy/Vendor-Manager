import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/authMiddleware';

export class AuthController {
  // POST /api/v1/auth/login
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required.' });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();
      const user = await UserModel.findOne({ email: cleanEmail });

      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid email or password. Please verify credentials.', message: 'Invalid email or password. Please verify credentials.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, error: 'Invalid email or password. Please verify credentials.', message: 'Invalid email or password. Please verify credentials.' });
        return;
      }

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        env.JWT_SECRET,
        { expiresIn: (env.JWT_EXPIRES_IN || '24h') as any }
      );

      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Login failed.' });
    }
  }

  // GET /api/v1/auth/me
  public static async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized session.' });
        return;
      }

      const user = await UserModel.findById(req.user.id).select('-password');
      if (!user) {
        res.status(404).json({ success: false, error: 'User account not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Session verification failed.' });
    }
  }

  // POST /api/v1/auth/users
  public static async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ success: false, error: 'Full name is required.' });
        return;
      }

      if (!email || !email.trim()) {
        res.status(400).json({ success: false, error: 'Email address is required.' });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
        return;
      }

      if (!password || password.length < 6) {
        res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
        return;
      }

      const existingUser = await UserModel.findOne({ email: cleanEmail });
      if (existingUser) {
        res.status(400).json({ success: false, error: 'A user with this email address already exists.' });
        return;
      }

      const validRoles = ['admin', 'manager'];
      const userRole = role && validRoles.includes(role.trim().toLowerCase())
        ? role.trim().toLowerCase()
        : 'admin';

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await UserModel.create({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: userRole,
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        data: {
          user: {
            id: newUser._id.toString(),
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            createdAt: newUser.createdAt,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to create user.' });
    }
  }

  // GET /api/v1/auth/users
  public static async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await UserModel.find()
        .select('-password')
        .sort({ createdAt: -1 });

      const formatted = users.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));

      res.status(200).json({
        success: true,
        data: {
          users: formatted,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch users.' });
    }
  }

  // DELETE /api/v1/auth/users/:id
  public static async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Strictly restrict user deletion to administrator role
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Access denied: Only administrators have permission to delete user accounts.',
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({ success: false, error: 'User ID is required.' });
        return;
      }

      // Prevent deleting own currently active account
      if (req.user && req.user.id === id) {
        res.status(400).json({ success: false, error: 'You cannot delete your own active account.' });
        return;
      }

      const userToDelete = await UserModel.findById(id);
      if (!userToDelete) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      // If user is admin, make sure there's at least one other admin remaining
      if (userToDelete.role === 'admin') {
        const adminCount = await UserModel.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          res.status(400).json({ success: false, error: 'Cannot delete the only remaining administrator account.' });
          return;
        }
      }

      await UserModel.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully.',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to delete user.' });
    }
  }
}
