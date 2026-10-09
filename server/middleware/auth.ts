import jwt from 'jsonwebtoken';
import User from '../models/User';
import type { Request, Response, NextFunction } from 'express';

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret') as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'Token invalid' });
    }
    req.userId = user._id.toString();
    req.userRole = user.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};