import type { Response } from 'express';

/**
 * Central error responder. 5xx is logged here and — in production — never
 * leaks Mongo/stack internals to the client ("Cast to ObjectId failed…",
 * connection strings, etc). 4xx messages are intentional app/validation
 * messages and pass through unchanged.
 */
export function errorResponse(res: Response, status: number, err: any) {
  if (status >= 500) console.error('API error:', err);
  const fallback = status >= 500 ? 'Internal server error' : 'Request failed';
  const message =
    status >= 500 && process.env.NODE_ENV === 'production'
      ? fallback
      : err?.message || fallback;
  res.status(status).json({ error: message });
}
