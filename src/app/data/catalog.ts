import { Bouquet } from '../types';
import { bouquets as seedBouquets } from './bouquets';

/**
 * Live catalogue store.
 *
 * Most pages need the bouquet list during render, but the AI engine in
 * `utils/aiRecommendations` is a plain module (no hooks available), so the
 * list also lives here. `ProductsContext` writes to it whenever the API
 * responds; hook consumers re-render through the context, non-hook consumers
 * read `getCatalog()` at call time.
 */
let catalog: Bouquet[] = seedBouquets;

export function getCatalog(): Bouquet[] {
  return catalog;
}

export function setCatalog(next: Bouquet[]): void {
  catalog = next;
}
