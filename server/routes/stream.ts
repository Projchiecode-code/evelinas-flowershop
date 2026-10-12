import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { getJwtSecret } from '../middleware/auth';
import { addClient, removeClient } from '../utils/sse';

const router = Router();

/**
 * GET /api/stream?token=<jwt> — Server-Sent Events feed for real-time updates.
 *
 * The browser's EventSource API cannot attach an Authorization header, so the
 * JWT rides in the query string (same token the SPA already holds from login).
 * The connection then pushes:
 *   - `order:status` / `order:new` — the viewer's own orders (and, for admins,
 *     every order in the shop)
 *   - `notification:new` — the viewer's bell, the moment it is written
 *
 * A comment heartbeat every 25 s keeps Render's proxy from idling the socket
 * out; browsers treat it as a live connection and silently ignore it.
 */
router.get('/', async (req, res) => {
  const header = req.headers.authorization || '';
  const token =
    (typeof req.query.token === 'string' && req.query.token) ||
    (header.startsWith('Bearer ') ? header.slice(7) : '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  let userId: string;
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
    userId = String(decoded.userId);
  } catch {
    return res.status(401).json({ error: 'Token invalid' });
  }

  const user = await User.findById(userId).select('role').lean();
  if (!user) {
    return res.status(401).json({ error: 'Token invalid' });
  }

  res.status(200).set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    // Render's proxy buffers by default — this tells it to stream bytes through.
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const client = { userId, role: String((user as any).role || 'customer'), res };
  addClient(client);
  res.write(`event: hello\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      // socket already gone — close handler cleans up
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(client);
  });
});

export default router;
