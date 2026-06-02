import { PRODUCTS } from "@/data/products";

export function pricingPaymentPageCheckout(productId: string, amountAud: number) {
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p) {
    throw new Error("Please select a valid product.");
  }

  const unitAud = Number(amountAud);
  if (!Number.isFinite(unitAud) || unitAud < 0.5) {
    throw new Error("Payment amount must be at least A$0.50.");
  }

  const subtotalAud = Math.round(unitAud * 100) / 100;
  const totalAud = subtotalAud;

  return {
    subtotalAud,
    shippingAud: 0,
    totalAud,
    items: [
      {
        productId: p.id,
        title: p.title.slice(0, 120),
        unitAud: subtotalAud,
        quantity: 1,
        imageSrc: p.imageSrc,
      },
    ],
  };
}
