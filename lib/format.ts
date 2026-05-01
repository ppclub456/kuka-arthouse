const audFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Storefront price line — Australian dollars (matches Inka Shopify AUD) */
export function formatMoaPrice(amount: number): string {
  return audFormatter.format(amount);
}

/** @deprecated Use formatMoaPrice (AUD). Kept for any stray imports. */
export function formatNzd(amount: number): string {
  return formatMoaPrice(amount);
}
