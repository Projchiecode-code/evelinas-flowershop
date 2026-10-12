import type { Response } from 'express';

/**
 * Server-Sent Events registry — the push half of "real-time order tracking".
 *
 * Every open EventSource connection registers here with the user id (and role)
 * it authenticated as. Route handlers call `emit()` after a state change so
 * the affected customer's browser (and every admin dashboard) updates the
 * instant it happens, instead of waiting for the next poll.
 *
 * Single-process in-memory registry: the API runs as one Render instance, so
 * there is no cross-process fan-out to solve. If the service ever scales to
 * multiple instances, swap this for Redis pub/sub behind the same two functions.
 */
interface SseClient {
  userId: string;
  role: string;
  res: Response;
}

const clients = new Set<SseClient>();

export function addClient(client: SseClient): void {
  clients.add(client);
}

export function removeClient(client: SseClient): void {
  clients.delete(client);
}

export const clientCount = (): number => clients.size;

/**
 * Push one event to the relevant viewers.
 * - `userId`: only that user's connections (customer-targeted updates)
 * - `admin: true`: every connection authenticated as an admin
 * - neither: every connected client (broadcasts)
 * A dead socket is dropped rather than allowed to throw into the caller —
 * a dropped push must never fail the order action that triggered it.
 */
export function emit(
  event: string,
  data: unknown,
  opts?: { userId?: string | null; admin?: boolean },
): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    const targeted = !!opts?.userId && client.userId === opts.userId;
    const admin = !!opts?.admin && client.role === 'admin';
    if (!targeted && !admin) continue;
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}
