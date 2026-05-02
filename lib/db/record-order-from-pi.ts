import type Stripe from "stripe";
import { orders } from "@/lib/db/schema";
import { getOrdersDb } from "@/lib/db/client";

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
      })
      .onConflictDoNothing({ target: orders.stripePaymentIntentId });
    return true;
  } catch (e) {
    console.error("[orders] insert failed:", e);
    throw e;
  }
}
