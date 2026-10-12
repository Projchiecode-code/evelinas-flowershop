import { recommendationApi } from '../api/client';
import { CoOrderMap } from './aiRecommendations';
import { getCatalog } from '../data/catalog';

/**
 * Session cache for the "customers who ordered X also ordered Y" table.
 * One request per session (60 s TTL) is shared by the AI Picks quiz and every
 * product page; failures resolve to an empty map so recommendations still
 * work offline of the API — the collaborative signal is a bonus layer.
 */
let cache: { data: CoOrderMap; at: number } | null = null;
let inflight: Promise<CoOrderMap> | null = null;

const TTL_MS = 60_000;

export function fetchCoOrders(): Promise<CoOrderMap> {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return Promise.resolve(cache.data);
  }
  if (inflight) return inflight;

  inflight = recommendationApi
    .getCoOrders()
    .then((raw: any) => {
      // The server keys pairs by product name (orders carry Mongo ids, the
      // storefront uses local catalogue ids) — translate to catalogue ids.
      const idByName = new Map(getCatalog().map(b => [b.name.trim().toLowerCase(), b.id]));
      const map: CoOrderMap = {};
      for (const [name, partners] of Object.entries(raw || {})) {
        const id = idByName.get(name.trim().toLowerCase());
        if (!id) continue;
        const resolved = (partners as any[])
          .map(p => ({
            id: idByName.get(String(p?.name || '').trim().toLowerCase()) || '',
            together: Number(p?.together) || 0,
            customers: Number(p?.customers) || 0,
          }))
          .filter(p => p.id && p.customers > 0)
          .slice(0, 5);
        if (resolved.length > 0) map[id] = resolved;
      }
      cache = { data: map, at: Date.now() };
      return map;
    })
    .catch(() => {
      const empty: CoOrderMap = {};
      cache = { data: empty, at: Date.now() };
      return empty;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
