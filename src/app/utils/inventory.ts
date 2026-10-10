import { Bouquet } from '../types';

/**
 * Phase 5 — inventory monitoring (client half).
 *
 * Threshold mirrors server/utils/lowStock.ts — keep both at 5 or the bell
 * alerts and the dashboard badges will disagree.
 */
export const LOW_STOCK_THRESHOLD = 5;

export type StockStatus = 'out' | 'low' | 'ok';

/**
 * Single source of truth for every inventory badge on the client:
 * dashboard widget, reports table, product filter chips, mobile unit lines.
 * - out:   not orderable (flag off or zero units)
 * - low:   orderable but at/below the threshold — needs a restock soon
 * - ok:    comfortably stocked
 */
export function classifyStock(b: Pick<Bouquet, 'stock' | 'inStock'>): StockStatus {
  if (!b.inStock || b.stock <= 0) return 'out';
  if (b.stock <= LOW_STOCK_THRESHOLD) return 'low';
  return 'ok';
}

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  out: 'Out of stock',
  low: 'Low stock',
  ok: 'In stock',
};

/** "3 units left" / "1 unit left" — singular-aware for the admin tables. */
export function unitsLeft(stock: number): string {
  return `${stock} unit${stock === 1 ? '' : 's'} left`;
}
