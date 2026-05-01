import { PRODUCTS } from "@/data/products";

export type AdminQuoteMode = "invoice" | "catalog" | "custom";

export type AdminQuotePayload = {
  mode: AdminQuoteMode;
  invoiceTitle?: string;
  invoiceTotalAud?: number;
  productId?: string;
  usePriceOverride?: boolean;
  catalogOverrideAud?: number;
  customTitle?: string;
  customUnitAud?: number;
  quantity?: number;
};

export function resolveAdminStripeQuote(payload: AdminQuotePayload) {
  const qtyParsed = Number.parseInt(String(payload.quantity ?? 1), 10);
  let qtySafe = Number.isFinite(qtyParsed) && qtyParsed > 0 ? qtyParsed : 1;

  let unitAud = 0;
  let title = "";
  const imageSrcs: string[] = [];
  let productId: string | undefined;

  if (payload.mode === "invoice") {
    qtySafe = 1;
    const n = Number.parseFloat(String(payload.invoiceTotalAud ?? 0));
    unitAud = Number.isFinite(n) ? n : 0;
    title = String(payload.invoiceTitle ?? "").trim() || "Payment order";
  } else if (payload.mode === "catalog") {
    const id = String(payload.productId ?? "").trim();
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) throw new Error("Invalid product selection");
    productId = p.id;
    if (payload.usePriceOverride) {
      const o = Number.parseFloat(String(payload.catalogOverrideAud ?? 0));
      unitAud = Number.isFinite(o) ? o : p.priceAud;
    } else {
      unitAud = p.priceAud;
    }
    title = p.title.slice(0, 120);
    imageSrcs.push(p.imageSrc);
  } else {
    const n = Number.parseFloat(String(payload.customUnitAud ?? 0));
    unitAud = Number.isFinite(n) ? n : 0;
    title = String(payload.customTitle ?? "").trim() || "Custom payment";
  }

  const lineTotalAud = unitAud * qtySafe;

  return {
    unitAud,
    quantity: qtySafe,
    title,
    lineTotalAud,
    imageSrcs,
    productId,
    mode: payload.mode,
  };
}
