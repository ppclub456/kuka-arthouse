/** Maps `orders.checkout_kind` / Stripe `metadata.checkout_kind` for admin screens. */
export function orderChannelAdminLabel(kind: string | null | undefined): string {
  const raw = typeof kind === "string" ? kind.trim() : "";
  if (!raw) return "—";
  const k = raw.toLowerCase();
  if (k === "store") return "Store";
  if (k === "customer_order") return "Payment order link";
  if (k === "admin_link") return "Payment order link";
  if (k === "payment_page") return "Payment page";
  return raw;
}
