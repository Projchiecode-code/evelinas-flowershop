import { Router } from 'express';
import Order from '../models/Order';
import Bouquet from '../models/Bouquet';

const router = Router();

/**
 * GET /recommendations/co-orders — "customers who ordered X also ordered Y".
 *
 * The collaborative-filtering half of the AI personalization: pair counts are
 * computed from the shop's REAL order history, so the weights come from what
 * customers actually buy together — not from hand-tuned rules.
 *
 * Orders carry MongoDB ObjectIds while the storefront catalogue uses its own
 * local ids, so pairs are keyed by product NAME here (the stable bridge the
 * client already uses at checkout); the client maps names back to catalogue
 * ids. Custom Design Studio bouquets have no catalog product and are skipped.
 * Cancelled orders never taught us anything, so they are excluded.
 *
 * The aggregation is O(orders × items²) and cached for a minute — orders
 * change rarely, and every visitor shares the same global table.
 */
interface PairEntry {
  name: string;
  /** distinct orders containing both products */
  together: number;
  /** distinct customers who bought both */
  customers: number;
}

let cache: { at: number; data: Record<string, PairEntry[]> } | null = null;
const CACHE_MS = 60_000;

async function buildCoOrders(): Promise<Record<string, PairEntry[]>> {
  const [orders, products] = await Promise.all([
    Order.find({ status: { $ne: 'cancelled' } })
      .select('items.bouquet customerName email')
      .lean(),
    Bouquet.find().select('name').lean(),
  ]);

  const nameById = new Map<string, string>();
  for (const p of products as any[]) {
    nameById.set(String(p._id), String(p.name || '').trim());
  }

  // partner map per product name: partnerName -> accumulated counts
  const partners = new Map<string, Map<string, { together: number; customers: Set<string> }>>();

  for (const order of orders as any[]) {
    // Unique products in this order, resolved to names (drop customs/anon).
    const names: string[] = [
      ...new Set<string>(
        (order.items || []).map((item: any) => nameById.get(String(item.bouquet || '')) || ''),
      ),
    ].filter(Boolean).sort();
    const who = String(order.email || order.customerName || '').toLowerCase();

    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        for (const [a, b] of [
          [names[i], names[j]],
          [names[j], names[i]],
        ]) {
          if (!partners.has(a)) partners.set(a, new Map());
          const row = partners.get(a)!;
          if (!row.has(b)) row.set(b, { together: 0, customers: new Set() });
          const entry = row.get(b)!;
          entry.together += 1;
          if (who) entry.customers.add(who);
        }
      }
    }
  }

  const data: Record<string, PairEntry[]> = {};
  for (const [name, row] of partners) {
    data[name] = [...row.entries()]
      .map(([partnerName, counts]) => ({
        name: partnerName,
        together: counts.together,
        customers: counts.customers.size,
      }))
      .sort((x, y) => y.customers - x.customers || y.together - x.together)
      .slice(0, 5);
  }
  return data;
}

router.get('/co-orders', async (_req, res) => {
  try {
    if (cache && Date.now() - cache.at < CACHE_MS) {
      return res.json(cache.data);
    }
    const data = await buildCoOrders();
    cache = { at: Date.now(), data };
    res.json(data);
  } catch (err) {
    console.error('Co-orders aggregation failed:', err);
    // Never break the recommendations page over a bonus signal.
    res.json(cache?.data ?? {});
  }
});

export default router;
