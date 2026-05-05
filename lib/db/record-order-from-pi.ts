import type Stripe from "stripe";
import type { OrderCartLineSnapshot } from "@/lib/db/schema";
import { orders } from "@/lib/db/schema";
import { getOrdersDb } from "@/lib/db/client";
import {
  sanitizeStripeCustomerId,
  upsertCustomerForOrder,
} from "@/lib/db/customer-repo";

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

function mv(
  meta: Stripe.Metadata,
  key: string,
  max: number,
): string | null {
  const v = meta[key];
  if (typeof v !== "string" || !v.trim()) return null;
  return v.trim().slice(0, max);
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

  const chargeRaw = pi.latest_charge;
  let stripeChargeId: string | null = null;
  let receiptUrl: string | null = null;
  let customerEmail =
    pi.receipt_email ?? null;

  let billingNameCharge: string | null = null;
  let billingPhoneCharge: string | null = null;
  let billingLine1Charge: string | null = null;
  let billingCityCharge: string | null = null;
  let billingPostalCharge: string | null = null;
  let billingCountryCharge: string | null = null;

  if (
    typeof chargeRaw === "object" &&
    chargeRaw &&
    !(chargeRaw as { deleted?: boolean }).deleted &&
    chargeRaw.object === "charge"
  ) {
    const ch = chargeRaw as Stripe.Charge;
    stripeChargeId = ch.id;
    receiptUrl = typeof ch.receipt_url === "string" ? ch.receipt_url : null;
    const em = ch.billing_details?.email;
    if (em && typeof em === "string") customerEmail = em;
    const bd = ch.billing_details;
    if (bd?.name) billingNameCharge = bd.name.slice(0, 240);
    if (bd?.phone) billingPhoneCharge = bd.phone.slice(0, 48);
    const addr = bd?.address;
    if (addr?.line1) billingLine1Charge = addr.line1.slice(0, 280);
    if (addr?.city) billingCityCharge = addr.city.slice(0, 120);
    if (addr?.postal_code) billingPostalCharge = addr.postal_code.slice(0, 48);
    if (addr?.country) billingCountryCharge = addr.country.slice(0, 24);
  }

  const checkoutKind =
    typeof meta.checkout_kind === "string" ? meta.checkout_kind : null;
  const adminMode =
    typeof meta.admin_mode === "string" ? meta.admin_mode : null;
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

  const shippingName = mv(meta, "shipping_name", 240) ?? billingNameCharge;
  const shippingPhone =
    mv(meta, "shipping_phone", 48) ??
    mv(meta, "billing_phone", 48) ??
    billingPhoneCharge;
  const shippingLine1 = mv(meta, "shipping_line1", 280);
  const shippingLine2 = mv(meta, "shipping_line2", 280);
  const shippingCity = mv(meta, "shipping_city", 120);
  const shippingPostal = mv(meta, "shipping_postal", 48);
  const shippingCountry = mv(meta, "shipping_country", 24);

  const billingName = mv(meta, "billing_name", 240) ?? billingNameCharge;
  const billingPhone =
    mv(meta, "billing_phone", 48) ?? billingPhoneCharge ?? shippingPhone;
  const billingLine1 = mv(meta, "billing_line1", 280) ?? billingLine1Charge;
  const billingLine2 = mv(meta, "billing_line2", 280);
  const billingCity = mv(meta, "billing_city", 120) ?? billingCityCharge;
  const billingPostal =
    mv(meta, "billing_postal", 48) ?? billingPostalCharge;
  const billingCountry =
    mv(meta, "billing_country", 24) ?? billingCountryCharge;

  const payLinkCode =
    typeof meta.pay_link_code === "string"
      ? meta.pay_link_code.trim().slice(0, 10)
      : null;

  const cartLines = parseCartLinesFromMeta(meta);

  let stripeCustomerId: string | null = null;
  const custRef = pi.customer;
  if (typeof custRef === "string") {
    stripeCustomerId = sanitizeStripeCustomerId(custRef);
  } else if (
    custRef &&
    typeof custRef === "object" &&
    !(custRef as { deleted?: boolean }).deleted &&
    typeof (custRef as { id?: unknown }).id === "string"
  ) {
    stripeCustomerId = sanitizeStripeCustomerId((custRef as { id: string }).id);
  }

  let customerId: number | null = null;
  try {
    customerId = await upsertCustomerForOrder(db, customerEmail, {
      fullName: shippingName ?? billingName,
      phone: shippingPhone ?? billingPhone,
      stripeCustomerId,
    });
  } catch (e) {
    console.error("[orders] customer upsert failed:", e);
  }

  try {
    await db
      .insert(orders)
      .values({
        stripePaymentIntentId: pi.id,
        stripeChargeId,
        amountAudCents: amountCents,
        currency: (pi.currency ?? "aud").toLowerCase(),
        status: pi.status,
        checkoutKind,
        adminMode,
        title: title ? title.slice(0, 500) : null,
        reference,
        customerEmail,
        productId,
        receiptUrl,
        subtotalAudCents: audStringToCents(meta.subtotal_aud),
        tipAudCents: audStringToCents(meta.tip_aud),
        shippingAudCents: audStringToCents(meta.shipping_aud),
        lineCount: parseIntMaybe(meta.line_count),
        customerId,
        fulfillmentStatus: "unfulfilled",
        internalNote: null,
        payLinkCode: payLinkCode || null,
        shippingName,
        shippingPhone,
        shippingLine1,
        shippingLine2,
        shippingCity,
        shippingPostal,
        shippingCountry,
        billingName,
        billingPhone,
        billingLine1,
        billingLine2,
        billingCity,
        billingPostal,
        billingCountry,
        cartLines,
      })
      .onConflictDoNothing({ target: orders.stripePaymentIntentId });
    return true;
  } catch (e) {
    console.error("[orders] insert failed:", e);
    throw e;
  }
}
