import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import User from '../models/User';
import { authenticate, getJwtSecret } from '../middleware/auth';
import { errorResponse } from '../utils/httpError';

const router = Router();

// Brute-force protection: failed attempts are capped per client IP. Real
// logins never trip it because successful requests aren't counted.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many attempts — please wait a few minutes and try again.' });
  },
});

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Type checks first: `password.length` on a non-string silently passes,
    // and a non-string email breaks `.toLowerCase()` below (500).
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string'
      || !name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (password.length < 6 || password.length > 100) {
      return res.status(400).json({ error: 'Password must be between 6 and 100 characters' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    const user = new User({ name, email: email.toLowerCase(), password, role: 'customer' });
    await user.save();
    const token = jwt.sign({ userId: user._id }, getJwtSecret(), { expiresIn: '7d' });
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ user: user.toSafeObject(), token });
  } catch (err: any) {
    console.error('Register error:', err);
    errorResponse(res, 500, err);
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    // Strings only (blocks `$ne`-style objects reaching findOne) and bounded,
    // so a megabyte "password" can't burn bcrypt before we reject it.
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length > 100) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user._id }, getJwtSecret(), { expiresIn: '7d' });
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ user: user.toSafeObject(), token });
  } catch (err: any) {
    console.error('Login error:', err);
    errorResponse(res, 500, err);
  }
});

router.post('/logout', (_req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  res.json({ success: true });
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

export default router;