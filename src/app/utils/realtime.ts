import { API_BASE, getAuthToken } from '../api/client';

export interface RealtimeHandlers {
  /** A notification row was just written for this viewer (or broadcast). */
  onNotification?: (raw: any) => void;
  /** One of this viewer's orders changed status (admins: any order). */
  onOrderStatus?: (data: { orderId: string; status: string; previousStatus?: string }) => void;
  /** A new order landed (admins only). */
  onOrderNew?: (data: { orderId: string; customerName: string; total: number }) => void;
}

/**
 * Subscribe to the API's Server-Sent Events feed (`GET /api/stream`).
 *
 * This is the push half of real-time tracking: order changes and new
 * notifications arrive the moment the server writes them, instead of the
 * client waiting for its next poll. The 30 s polling loops in the contexts
 * remain as a fallback for dropped connections — SSE simply makes the common
 * case instant.
 *
 * EventSource reconnects by itself on transient drops; if the socket lands
 * in CLOSED (expired token, network change) we rebuild it after a short
 * backoff, re-reading the token so a fresh login takes effect.
 */
export function subscribeRealtime(handlers: RealtimeHandlers): () => void {
  let source: EventSource | null = null;
  let retryTimer: number | undefined;
  let stopped = false;

  const connect = () => {
    if (stopped) return;
    const token = getAuthToken();
    if (!token) return; // signed out — the contexts re-subscribe after login

    try {
      source = new EventSource(`${API_BASE}/stream?token=${encodeURIComponent(token)}`);
    } catch {
      retryTimer = window.setTimeout(connect, 5000);
      return;
    }

    source.addEventListener('notification:new', e => {
      try {
        handlers.onNotification?.(JSON.parse((e as MessageEvent).data));
      } catch { /* malformed frame — ignore */ }
    });
    source.addEventListener('order:status', e => {
      try {
        handlers.onOrderStatus?.(JSON.parse((e as MessageEvent).data));
      } catch { /* ignore */ }
    });
    source.addEventListener('order:new', e => {
      try {
        handlers.onOrderNew?.(JSON.parse((e as MessageEvent).data));
      } catch { /* ignore */ }
    });

    source.onerror = () => {
      // CONNECTING → EventSource is retrying on its own; CLOSED → we rebuild.
      if (source && source.readyState === EventSource.CLOSED && !stopped) {
        source.close();
        source = null;
        retryTimer = window.setTimeout(connect, 5000);
      }
    };
  };

  connect();

  return () => {
    stopped = true;
    if (retryTimer) window.clearTimeout(retryTimer);
    source?.close();
    source = null;
  };
}
