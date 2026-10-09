/**
 * Recently-viewed bouquet ids, stored per browser.
 *
 * The recommendation engine has always accepted a `viewedBouquets` list, but
 * nothing ever recorded one — so the "similar to what you've been browsing"
 * logic could never fire. This is that missing behavioural signal.
 */
const STORAGE_KEY = 'evelinas_recent_views';
const MAX_VIEWS = 12;

function read(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    // Shape-check, not just parse-check: a corrupted value must not crash callers.
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/** Remember that a shopper opened a bouquet page (most recent first). */
export function recordView(bouquetId: string): void {
  if (!bouquetId) return;
  try {
    const views = [bouquetId, ...read().filter(id => id !== bouquetId)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views.slice(0, MAX_VIEWS)));
  } catch {
    // Storage full or blocked (private mode) — recommendations just lose this signal.
  }
}

/** The shopper's most recently viewed bouquet ids, newest first. */
export function getRecentViews(limit: number = 8): string[] {
  return read().slice(0, limit);
}
