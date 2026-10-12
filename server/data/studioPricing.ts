/**
 * Design Studio pricing mirror — server side.
 *
 * The customer builds custom bouquets in the Design Studio (flower stems,
 * wrap, ribbon, size) but those designs are NOT catalog products, so the
 * order route can't look them up in the Bouquet collection like it does for
 * everything else. This table mirrors src/app/data/studio.ts so the server
 * can validate a design and compute its price itself — a tampered client
 * can't decide what it pays. KEEP IN SYNC with data/studio.ts.
 */

export const STUDIO_STEM_PRICES: Record<string, number> = {
  rose: 30,
  tulip: 28,
  sunflower: 35,
  orchid: 45,
  lily: 38,
  peony: 45,
  carnation: 30,
  'babys-breath': 25,
};

export const STUDIO_SIZE_MULTIPLIERS: Record<string, number> = {
  small: 1,
  medium: 1.3,
  large: 1.6,
};

const SIZE_LABELS: Record<string, string> = { small: 'Small', medium: 'Medium', large: 'Large' };

const WRAP_STYLES = ['cone', 'fan', 'basket', 'pleated'];
const WRAP_COLORS = ['ivory', 'blush', 'kraft', 'red', 'black', 'lavender', 'mint', 'gold'];
const RIBBON_STYLES = ['bow', 'loop', 'tie'];
const RIBBON_COLORS = ['gold', 'red', 'ivory', 'blush', 'black', 'sage'];
const BLOOM_LOOKS = ['natural', 'full', 'airy'];

export const MAX_STUDIO_STEMS = 12;

export interface StudioCustomization {
  flowers: Record<string, number>;
  wrapStyle: string;
  wrapColor: string;
  ribbonStyle: string;
  ribbonColor: string;
  size: string;
  look: string;
}

function invalid(message: string): never {
  throw new Error(message);
}

/**
 * Validate a Design Studio customization and compute its price
 * (stem subtotal × size multiplier, rounded to whole pesos).
 * Throws an Error with a customer-safe message when the design is invalid.
 */
export function validateStudioCustomization(input: unknown): {
  customization: StudioCustomization;
  price: number;
  sizeName: string;
} {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    invalid('Invalid custom bouquet design');
  }
  const c = input as Record<string, unknown>;

  const flowersRaw = c.flowers;
  if (typeof flowersRaw !== 'object' || flowersRaw === null || Array.isArray(flowersRaw)) {
    invalid('Custom bouquet needs a flower selection');
  }
  const flowers: Record<string, number> = {};
  let stems = 0;
  let subtotal = 0;
  for (const [id, qtyRaw] of Object.entries(flowersRaw as Record<string, unknown>)) {
    if (!Object.prototype.hasOwnProperty.call(STUDIO_STEM_PRICES, id)) {
      invalid(`Custom bouquet has an unknown flower: ${id}`);
    }
    const qty = Number(qtyRaw);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_STUDIO_STEMS) {
      invalid('Custom bouquet flower counts must be whole numbers between 1 and 12');
    }
    flowers[id] = qty;
    stems += qty;
    subtotal += qty * STUDIO_STEM_PRICES[id];
  }
  if (stems < 1 || stems > MAX_STUDIO_STEMS) {
    invalid(`Custom bouquets need between 1 and ${MAX_STUDIO_STEMS} stems in total`);
  }

  const pick = (value: unknown, allowed: string[], label: string, fallback: string): string => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value !== 'string' || !allowed.includes(value)) {
      invalid(`Custom bouquet has an invalid ${label}`);
    }
    return value;
  };

  const size = pick(c.size, Object.keys(STUDIO_SIZE_MULTIPLIERS), 'size', 'medium');
  const customization: StudioCustomization = {
    flowers,
    wrapStyle: pick(c.wrapStyle, WRAP_STYLES, 'wrap style', 'cone'),
    wrapColor: pick(c.wrapColor, WRAP_COLORS, 'wrap color', 'blush'),
    ribbonStyle: pick(c.ribbonStyle, RIBBON_STYLES, 'ribbon style', 'bow'),
    ribbonColor: pick(c.ribbonColor, RIBBON_COLORS, 'ribbon color', 'gold'),
    size,
    look: pick(c.look, BLOOM_LOOKS, 'bloom look', 'natural'),
  };

  return {
    customization,
    price: Math.round(subtotal * STUDIO_SIZE_MULTIPLIERS[size]),
    sizeName: SIZE_LABELS[size] || 'Medium',
  };
}
