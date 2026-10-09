export const CURRENCY_SYMBOL = '₱';
export const CURRENCY_CODE = 'PHP';

export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPriceCompact(amount: number): string {
  if (amount >= 1000) {
    return `₱${(amount / 1000).toFixed(1)}k`;
  }
  return `₱${amount.toFixed(0)}`;
}