import type Stripe from "stripe";
import type { OrderCartLineSnapshot } from "@/lib/db/schema";
import { orders } from "@/lib/db/schema";
import { buildOrderContactPatchFromPaymentIntent } from "@/lib/stripe-order-contact";
import { getOrdersDb } from "@/lib/db/client";
import { normalizePayLinkCode } from "@/lib/db/pay-link-code";
import { upsertCustomerForOrder } from "@/lib/db/customer-repo";

function audStringToCents(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

function parseIntMaybe(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function parseCartLinesFromMeta(meta: Stripe.Metadata): OrderCartLineSnapshot[] | null {
  const raw = meta.cart_lines;
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    const lines: OrderCartLineSnapshot[] = [];
    for (const x of data) {
      if (!x || typeof x !== "object") continue;
      const o = x as Record<string, unknown>;
      const productId = String(o.productId ?? "").trim();
      const qty = Number(o.quantity);
      if (!productId || !Number.isFinite(qty) || qty <= 0) continue;
      lines.push({
        productId: productId.slice(0, 120),
        title: String(o.title ?? "").slice(0, 200),
        quantity: Math.floor(qty),
        unitAud: Number.isFinite(Number(o.unitAud)) ? Number(o.unitAud) : 0,
        lineTotalAud: Number.isFinite(Number(o.lineTotalAud))
          ? Number(o.lineTotalAud)
          : 0,
      });
    }
    return lines.length > 0 ? lines : null;
  } catch {
    return null;
  }
}

/** Persist a succeeded PaymentIntent (idempotent per PI id). */
export async function recordSucceededPaymentIntent(
  pi: Stripe.PaymentIntent,
): Promise<boolean> {
  const db = getOrdersDb();
  if (!db) {
    console.warn(
      "[orders] DATABASE_URL is not set — payment not archived locally.",
    );
    return false;
  }

  const meta = pi.metadata ?? {};
  const amountCents = pi.amount_received ?? pi.amount;
  if (!Number.isFinite(amountCents) || amountCents <= 0) return false;

  const contact = buildOrderContactPatchFromPaymentIntent(pi);

  const checkoutKind =
    typeof meta.checkout_kind === "string" ? meta.checkout_kind : null;
  const adminMode =
    typeof meta.order_flow === "string"
      ? meta.order_flow.slice(0, 48)
      : typeof meta.admin_mode === "string"
        ? meta.admin_mode.slice(0, 48)
        : null;
  const title =
    (typeof pi.description === "string" && pi.description
      ? pi.description
      : null) ??
    (checkoutKind === "store" ? "Kuka Arthouse — store order" : null);

  const reference =
    typeof meta.payment_reference === "string"
      ? meta.payment_reference.trim().slice(0, 180)
      : null;

  const productId =
    typeof meta.product_id === "string" ? meta.product_id : null;

  const payLinkMeta =
    typeof meta.pay_link_code === "string" ? meta.pay_link_code.trim() : "";
  const payLinkCode = payLinkMeta
    ? normalizePayLinkCode(payLinkMeta).slice(0, 16)
    : null;

  const cartLines = parseCartLinesFromMeta(meta);

  let customerId: number | null = null;
  try {
    customerId = await upsertCustomerForOrder(db, contact.customerEmail, {
      fullName: contact.shippingName ?? contact.billingName,
      phone: contact.shippingPhone ?? contact.billingPhone,
      stripeCustomerId: contact.stripeCustomerId,
    });
  } catch (e) {
    console.error("[orders] customer upsert failed:", e);
  }

  try {
    await db
      .insert(orders)
      .values({
        stripePaymentIntentId: pi.id,
        stripeChargeId: contact.stripeChargeId,
        amountAudCents: amountCents,
        currency: (pi.currency ?? "aud").toLowerCase(),
        status: pi.status,
        checkoutKind,
        adminMode,
        title: title ? title.slice(0, 500) : null,
        reference,
        customerEmail: contact.customerEmail,
        productId,
        receiptUrl: contact.receiptUrl,
        subtotalAudCents: audStringToCents(meta.subtotal_aud),
        tipAudCents: audStringToCents(meta.tip_aud),
        shippingAudCents: audStringToCents(meta.shipping_aud),
        lineCount: parseIntMaybe(meta.line_count),
        customerId,
        fulfillmentStatus: "unfulfilled",
        internalNote: null,
        fulfillmentCourier: "nz_post",
        payLinkCode: payLinkCode || null,
        shippingName: contact.shippingName,
        shippingPhone: contact.shippingPhone,
        shippingLine1: contact.shippingLine1,
        shippingLine2: contact.shippingLine2,
        shippingCity: contact.shippingCity,
        shippingPostal: contact.shippingPostal,
        shippingCountry: contact.shippingCountry,
        billingName: contact.billingName,
        billingPhone: contact.billingPhone,
        billingLine1: contact.billingLine1,
        billingLine2: contact.billingLine2,
        billingCity: contact.billingCity,
        billingPostal: contact.billingPostal,
        billingCountry: contact.billingCountry,
        cartLines,
      })
      .onConflictDoNothing({ target: orders.stripePaymentIntentId });
    return true;
  } catch (e) {
    console.error("[orders] insert failed:", e);
    throw e;
  }
}
