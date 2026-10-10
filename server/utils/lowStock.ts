import Notification from '../models/Notification';
import User from '../models/User';

/**
 * Phase 5 — inventory monitoring.
 *
 * Threshold is intentionally simple and shared with the client
 * (src/app/utils/inventory.ts must stay at 5): at or below 5 units a
 * product is "low stock", 0 units is "out of stock".
 */
export const LOW_STOCK_THRESHOLD = 5;

/**
 * Push an admin-only alert when stock crosses from above the threshold to
 * at or below it (including selling out). Crossings are computed from the
 * pre-update stock the reservation returned, so this fires exactly once per
 * real crossing — never for the decrement itself.
 *
 * Guard rails:
 * - Never throws: a monitoring failure must not fail the order action.
 * - Targeted at admin accounts only (user: adminId) — a broadcast
 *   (user: null) would leak internal inventory data into customer bells.
 * - Deduped per product on {user, link, unread} so cancel → re-buy cycles
 *   can't spam the bell while an earlier alert is still unread.
 * - The link deep-links to the product edit form (?edit=) so the admin can
 *   restock in one click.
 */
export async function maybeAlertLowStock(
  bouquetId: any,
  bouquetName: string,
  prevStock: number,
  newStock: number,
  context: string,
) {
  if (typeof prevStock !== 'number' || typeof newStock !== 'number') return;
  if (!(prevStock > LOW_STOCK_THRESHOLD && newStock <= LOW_STOCK_THRESHOLD && newStock >= 0)) return;
  try {
    const link = `/admin/products?edit=${bouquetId}`;
    const soldOut = newStock === 0;
    const title = soldOut ? `Out of stock: ${bouquetName}` : `Low stock: ${bouquetName}`;
    const message = soldOut
      ? `"${bouquetName}" just sold out (${context}). Restock it from the Products page to keep selling.`
      : `"${bouquetName}" is down to ${newStock} unit${newStock === 1 ? '' : 's'} (${context}). Restock soon to avoid lost sales.`;

    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(admins.map(async admin => {
      const existing = await Notification.exists({ user: admin._id, link, read: false });
      if (existing) return;
      await Notification.create({ user: admin._id, title, message, type: 'system', link });
    }));
  } catch (err) {
    console.error('Low-stock alert failed:', err);
  }
}
