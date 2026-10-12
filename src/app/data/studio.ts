/**
 * Design Studio configuration — the customer-facing bouquet customizer.
 *
 * Pricing model (chosen by the shop): per-stem price × size multiplier.
 * Flower photos live in public/categories (Unsplash) and are shared with
 * the Home category tiles. Colors drive the SVG preview shades (hex = face,
 * shade = fold/shadow tone).
 */

/**
 * `photo` is the shop's reference shot for the flower (used in cart
 * thumbnails); the studio preview itself is a flat illustration, so the
 * bloom's look comes from the flower's palette in components/FlowerGlyph.
 */
export interface StudioFlower {
  id: string;
  name: string;
  /** Per-stem price in PHP. */
  price: number;
  photo: string;
}

export const STUDIO_FLOWERS: StudioFlower[] = [
  { id: 'rose', name: 'Rose', price: 30, photo: '/categories/roses.jpg' },
  { id: 'tulip', name: 'Tulip', price: 28, photo: '/categories/tulips.jpg' },
  { id: 'sunflower', name: 'Sunflower', price: 35, photo: '/categories/sunflowers.jpg' },
  { id: 'orchid', name: 'Orchid', price: 45, photo: '/categories/orchids.jpg' },
  { id: 'lily', name: 'Lily', price: 38, photo: '/categories/lilies.jpg' },
  { id: 'peony', name: 'Peony', price: 45, photo: '/categories/peonies.jpg' },
  { id: 'carnation', name: 'Carnation', price: 30, photo: '/categories/carnation.jpg' },
  { id: 'babys-breath', name: "Baby's Breath", price: 25, photo: '/categories/babys-breath.jpg' },
];

/** Mix a hex color toward white by `t` (0–1) — used for the wrap's lining. */
export const lighten = (hex: string, t: number): string => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) + (255 - ((n >> shift) & 255)) * t);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
};

/** How the florist wrap is shaped — each has its own drawing in the preview. */
export interface StudioWrapStyle {
  id: string;
  name: string;
}

export const WRAP_STYLES: StudioWrapStyle[] = [
  { id: 'cone', name: 'Classic Cone' },
  { id: 'fan', name: 'Wide Fan' },
  { id: 'basket', name: 'Basket' },
  { id: 'pleated', name: 'Pleated' },
];

/** How the ribbon is tied at the waist. */
export interface StudioRibbonStyle {
  id: string;
  name: string;
}

export const RIBBON_STYLES: StudioRibbonStyle[] = [
  { id: 'bow', name: 'Classic Bow' },
  { id: 'loop', name: 'Double Loop' },
  { id: 'tie', name: 'Simple Tie' },
];

/**
 * Arrangement density — `ringFactor` spreads the rosette rings apart /
 * together, `headFactor` scales the blooms (bigger + more overlap vs.
 * smaller and airy).
 */
export interface StudioBloomLook {
  id: string;
  name: string;
  tag: string;
  ringFactor: number;
  headFactor: number;
}

export const BLOOM_LOOKS: StudioBloomLook[] = [
  { id: 'natural', name: 'Natural', tag: 'Balanced', ringFactor: 1, headFactor: 1 },
  { id: 'full', name: 'Full', tag: 'Lush & round', ringFactor: 0.86, headFactor: 1.1 },
  { id: 'airy', name: 'Airy', tag: 'Spaced out', ringFactor: 1.16, headFactor: 0.93 },
];

export const getWrapStyle = (id: string) => WRAP_STYLES.find(s => s.id === id) ?? WRAP_STYLES[0];
export const getRibbonStyle = (id: string) => RIBBON_STYLES.find(s => s.id === id) ?? RIBBON_STYLES[0];
export const getBloomLook = (id: string) => BLOOM_LOOKS.find(s => s.id === id) ?? BLOOM_LOOKS[0];

export interface StudioColor {
  id: string;
  name: string;
  /** Face color of the paper / ribbon. */
  hex: string;
  /** Darker tone used for folds and shading. */
  shade: string;
}

export const WRAP_COLORS: StudioColor[] = [
  { id: 'ivory', name: 'Ivory White', hex: '#F7F4EE', shade: '#E5DFD2' },
  { id: 'blush', name: 'Blush Pink', hex: '#F6C6D2', shade: '#E7A6B8' },
  { id: 'kraft', name: 'Kraft Brown', hex: '#D9B98C', shade: '#C19F71' },
  { id: 'red', name: 'Classic Red', hex: '#C43B4B', shade: '#A52E3D' },
  { id: 'black', name: 'Midnight Black', hex: '#3B3541', shade: '#2A2630' },
  { id: 'lavender', name: 'Lavender', hex: '#CBB8E8', shade: '#B19CD7' },
  { id: 'mint', name: 'Sage Mint', hex: '#BFE0CC', shade: '#A2CBB3' },
  { id: 'gold', name: 'Champagne Gold', hex: '#E6C789', shade: '#D0AC63' },
];

export const RIBBON_COLORS: StudioColor[] = [
  { id: 'gold', name: 'Gold', hex: '#E7C15C', shade: '#CDA33F' },
  { id: 'red', name: 'Red', hex: '#D33F49', shade: '#B23039' },
  { id: 'ivory', name: 'Ivory', hex: '#F8F5EF', shade: '#E2DBCC' },
  { id: 'blush', name: 'Blush', hex: '#F2A9BC', shade: '#E08BA1' },
  { id: 'black', name: 'Black', hex: '#35303B', shade: '#231F29' },
  { id: 'sage', name: 'Sage', hex: '#9FB89A', shade: '#86A082' },
];

export interface StudioSize {
  id: string;
  name: string;
  tag: string;
  multiplier: number;
  /** Base radius of each flower head in the preview. */
  flowerR: number;
  /** Scales the rosette rings so larger sizes look fuller. */
  ringScale: number;
}

export const SIZES: StudioSize[] = [
  { id: 'small', name: 'Small', tag: 'Petite', multiplier: 1, flowerR: 30, ringScale: 0.9 },
  { id: 'medium', name: 'Medium', tag: 'Classic', multiplier: 1.3, flowerR: 34, ringScale: 1 },
  { id: 'large', name: 'Large', tag: 'Grand', multiplier: 1.6, flowerR: 38, ringScale: 1.06 },
];

/** Total stems allowed per custom bouquet. */
export const MAX_STEMS = 12;

export const totalStems = (qtys: Record<string, number>) =>
  STUDIO_FLOWERS.reduce((sum, f) => sum + (qtys[f.id] || 0), 0);

/** Stem subtotal before the size multiplier. */
export const stemsSubtotal = (qtys: Record<string, number>) =>
  STUDIO_FLOWERS.reduce((sum, f) => sum + (qtys[f.id] || 0) * f.price, 0);

export const getSize = (sizeId: string) => SIZES.find(s => s.id === sizeId) ?? SIZES[1];
export const getWrap = (wrapId: string) => WRAP_COLORS.find(w => w.id === wrapId) ?? WRAP_COLORS[1];
export const getRibbon = (ribbonId: string) => RIBBON_COLORS.find(r => r.id === ribbonId) ?? RIBBON_COLORS[0];

/** "4× Rose, 3× Lily" — one-line flower summary for cart / order displays. */
export const flowerSummary = (flowers: Record<string, number>) =>
  STUDIO_FLOWERS.filter(f => (flowers[f.id] || 0) > 0)
    .map(f => `${flowers[f.id]}× ${f.name}`)
    .join(', ');

/** Reference photo of a studio flower (cart thumbnails, order placeholders). */
export const flowerPhoto = (flowerId: string) =>
  STUDIO_FLOWERS.find(f => f.id === flowerId)?.photo ?? STUDIO_FLOWERS[0].photo;

/** Final price: stems × size multiplier, rounded to whole pesos. */
export const studioPrice = (qtys: Record<string, number>, sizeId: string) =>
  Math.round(stemsSubtotal(qtys) * getSize(sizeId).multiplier);
