import type { Request } from 'express';

/**
 * Opt-in pagination for list endpoints.
 *
 * Requesting `?page=…` switches the response to an envelope
 * `{ items, total, page, pages, limit }`; omitting `page` keeps the legacy
 * bare-array response every existing client expects. That way pagination can
 * ship endpoint-by-endpoint without breaking callers that need the full list.
 *
 * `limit` is clamped server-side so a crafted URL can't ask for 10k docs.
 */
export function parsePage(req: Request, defaultLimit = 20, maxLimit = 100) {
  const paged = req.query.page !== undefined;
  let page = Number.parseInt(String(req.query.page ?? ''), 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  let limit = Number.parseInt(String(req.query.limit ?? ''), 10);
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  limit = Math.min(limit, maxLimit);
  return { paged, page, limit, skip: (page - 1) * limit };
}

export function envelope<T>(items: T[], total: number, page: number, limit: number) {
  return {
    items,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    limit,
  };
}
