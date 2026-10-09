import jwt from 'jsonwebtoken';
import User from '../models/User';
import type { Request, Response, NextFunction } from 'express';

/**
 * Single source of truth for the JWT secret. Production must never fall back
 * to a publicly known string (anyone could forge an admin token), so a
 * missing JWT_SECRET is fatal at boot — called from server/index.ts before we
 * listen. Local dev keeps a fixed fallback for convenience.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    console.error("FATAL: JWT_SECRET is not set — refusing to start with a forgeable token secret.");
    process.exit(1);
  }
  return 'defaultsecret'; // local development only
}

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
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
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