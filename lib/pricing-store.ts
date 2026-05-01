import { PRODUCTS } from "@/data/products";

export type StoreCheckoutLineInput = { productId: string; quantity: number };

export function pricingStoreCheckout(
  rawLines: StoreCheckoutLineInput[],
  tipAud: number,
  feeFraction = 0.08,
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

  const afterTip = subtotal + tip;
  const feeAud = afterTip * feeFraction;
  const totalAud = afterTip + feeAud;

  return {
    subtotalAud: subtotal,
    tipAud: tip,
    feeAud,
    totalAud,
    items,
  };
}
