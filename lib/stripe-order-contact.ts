import type Stripe from "stripe";
import { sanitizeStripeCustomerId } from "@/lib/db/customer-repo";

/**
 * Contact + address fields we persist on `orders`, derived from a PaymentIntent plus
 * embedded Charge (when expanded). Priority: PI metadata (merchant), then PI.shipping /
 * Charge.shipping (Stripe Payment Element / Checkout), then Charge.billing_details.
 */
export type StripeOrderContactPatch = {
  customerEmail: string | null;
  stripeChargeId: string | null;
  receiptUrl: string | null;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingPostal: string | null;
  shippingCountry: string | null;
  billingName: string | null;
  billingPhone: string | null;
  billingLine1: string | null;
  billingLine2: string | null;
  billingCity: string | null;
  billingPostal: string | null;
  billingCountry: string | null;
  stripeCustomerId: string | null;
};

function mv(meta: Stripe.Metadata, key: string, max: number): string | null {
  const v = meta[key];
  if (typeof v !== "string" || !v.trim()) return null;
  return v.trim().slice(0, max);
}

function resolveExpandedCharge(pi: Stripe.PaymentIntent): Stripe.Charge | null {
  const chargeRaw = pi.latest_charge;
  if (
    typeof chargeRaw === "object" &&
    chargeRaw &&
    !(chargeRaw as { deleted?: boolean }).deleted &&
    chargeRaw.object === "charge"
  ) {
    return chargeRaw as Stripe.Charge;
  }
  return null;
}

type StripeShipBlock = Stripe.PaymentIntent.Shipping | Stripe.Charge.Shipping;

function shippingRowsFromStripeShip(
  src: StripeShipBlock | null | undefined,
): Omit<
  StripeOrderContactPatch,
  | "customerEmail"
  | "stripeChargeId"
  | "receiptUrl"
  | "billingName"
  | "billingPhone"
  | "billingLine1"
  | "billingLine2"
  | "billingCity"
  | "billingPostal"
  | "billingCountry"
  | "stripeCustomerId"
> | null {
  if (!src || typeof src !== "object") return null;
  const name =
    typeof src.name === "string" && src.name.trim()
      ? src.name.trim().slice(0, 240)
      : null;
  const phone =
    typeof src.phone === "string" && src.phone.trim()
      ? src.phone.trim().slice(0, 48)
      : null;
  const addr = src.address;
  const line1 =
    addr && typeof addr.line1 === "string" && addr.line1.trim()
      ? addr.line1.trim().slice(0, 280)
      : null;
  const line2 =
    addr && typeof addr.line2 === "string" && addr.line2.trim()
      ? addr.line2.trim().slice(0, 280)
      : null;
  const city =
    addr && typeof addr.city === "string" && addr.city.trim()
      ? addr.city.trim().slice(0, 120)
      : null;
  const postal =
    addr && typeof addr.postal_code === "string" && addr.postal_code.trim()
      ? addr.postal_code.trim().slice(0, 48)
      : null;
  const country =
    addr && typeof addr.country === "string" && addr.country.trim()
      ? addr.country.trim().slice(0, 24)
      : null;

  if (!name && !phone && !line1 && !line2 && !city && !postal && !country)
    return null;

  return {
    shippingName: name,
    shippingPhone: phone,
    shippingLine1: line1,
    shippingLine2: line2,
    shippingCity: city,
    shippingPostal: postal,
    shippingCountry: country,
  };
}

function shippingFromPiOrCharge(
  pi: Stripe.PaymentIntent,
  ch: Stripe.Charge | null,
) {
  return (
    shippingRowsFromStripeShip(pi.shipping) ??
    shippingRowsFromStripeShip(ch?.shipping)
  );
}

export function buildOrderContactPatchFromPaymentIntent(
  pi: Stripe.PaymentIntent,
): StripeOrderContactPatch {
  const meta = pi.metadata ?? {};
  const ch = resolveExpandedCharge(pi);

  let stripeChargeId: string | null = null;
  let receiptUrl: string | null = null;
  let customerEmail: string | null = pi.receipt_email ?? null;

  let billingNameCharge: string | null = null;
  let billingPhoneCharge: string | null = null;
  let billingLine1Charge: string | null = null;
  let billingLine2Charge: string | null = null;
  let billingCityCharge: string | null = null;
  let billingPostalCharge: string | null = null;
  let billingCountryCharge: string | null = null;

  if (ch) {
    stripeChargeId = ch.id;
    receiptUrl = typeof ch.receipt_url === "string" ? ch.receipt_url : null;
    const em = ch.billing_details?.email;
    if (em && typeof em === "string") customerEmail = em;
    const bd = ch.billing_details;
    if (bd?.name) billingNameCharge = bd.name.slice(0, 240);
    if (bd?.phone) billingPhoneCharge = bd.phone.slice(0, 48);
    const addr = bd?.address;
    if (addr?.line1) billingLine1Charge = addr.line1.slice(0, 280);
    if (addr?.line2) billingLine2Charge = addr.line2.slice(0, 280);
    if (addr?.city) billingCityCharge = addr.city.slice(0, 120);
    if (addr?.postal_code) billingPostalCharge = addr.postal_code.slice(0, 48);
    if (addr?.country) billingCountryCharge = addr.country.slice(0, 24);
  }

  const stripeShip = shippingFromPiOrCharge(pi, ch);

  const shippingName =
    mv(meta, "shipping_name", 240) ??
    stripeShip?.shippingName ??
    billingNameCharge;
  const shippingPhone =
    mv(meta, "shipping_phone", 48) ??
    stripeShip?.shippingPhone ??
    mv(meta, "billing_phone", 48) ??
    billingPhoneCharge;
  const shippingLine1 =
    mv(meta, "shipping_line1", 280) ?? stripeShip?.shippingLine1 ?? null;
  const shippingLine2 =
    mv(meta, "shipping_line2", 280) ?? stripeShip?.shippingLine2 ?? null;
  const shippingCity =
    mv(meta, "shipping_city", 120) ?? stripeShip?.shippingCity ?? null;
  const shippingPostal =
    mv(meta, "shipping_postal", 48) ?? stripeShip?.shippingPostal ?? null;
  const shippingCountry =
    mv(meta, "shipping_country", 24) ?? stripeShip?.shippingCountry ?? null;

  const billingName =
    mv(meta, "billing_name", 240) ?? billingNameCharge ?? null;
  const billingPhone =
    mv(meta, "billing_phone", 48) ??
    billingPhoneCharge ??
    shippingPhone;
  const billingLine1 =
    mv(meta, "billing_line1", 280) ?? billingLine1Charge ?? null;
  const billingLine2 =
    mv(meta, "billing_line2", 280) ?? billingLine2Charge ?? null;
  const billingCity =
    mv(meta, "billing_city", 120) ?? billingCityCharge ?? null;
  const billingPostal =
    mv(meta, "billing_postal", 48) ?? billingPostalCharge ?? null;
  const billingCountry =
    mv(meta, "billing_country", 24) ?? billingCountryCharge ?? null;

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

  return {
    customerEmail,
    stripeChargeId,
    receiptUrl,
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
    stripeCustomerId,
  };
}
