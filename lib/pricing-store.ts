import { PRODUCTS } from "@/data/products";

export type StoreCheckoutLineInput = { productId: string; quantity: number };

/** Flat shipping applied once per order (AUD). */
export const STORE_FLAT_SHIPPING_AUD = 12;

export function pricingStoreCheckout(
  rawLines: StoreCheckoutLineInput[],
  tipAud: number,
) {
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    throw new Error("Cart is empty");
  }
  const tip = Number.isFinite(tipAud) && tipAud >= 0 ? tipAud : 0;
  let subtotal = 0;
  const items: Array<{
    productId: string;
    title: string;
    unitAud: number;
    quantity: number;
    imageSrc: string;
  }> = [];

  for (const raw of rawLines) {
    const p = PRODUCTS.find((x) => x.id === raw.productId);
    if (!p) throw new Error(`Unknown product: ${raw.productId}`);
    const qty = Math.max(1, Math.floor(Number(raw.quantity) || 0));
    subtotal += p.priceAud * qty;
    items.push({
      productId: p.id,
      title: p.title.slice(0, 120),
      unitAud: p.priceAud,
      quantity: qty,
      imageSrc: p.imageSrc,
    });
  }

  const shippingAud = STORE_FLAT_SHIPPING_AUD;
  const totalAud = subtotal + tip + shippingAud;

  return {
    subtotalAud: subtotal,
    tipAud: tip,
    shippingAud,
    totalAud,
    items,
  };
}
