import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { requireAdminOr401 } from "@/lib/require-admin-session";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

async function summarizeSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
) {
  let declineMessage: string | null = null;
  let declineCode: string | null = null;
  let cardBrand: string | null = null;
  let cardLast4: string | null = null;

  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  if (piId) {
    const pi = await stripe.paymentIntents.retrieve(piId, {
      expand: ["latest_charge.payment_method_details.card"],
    });
    declineMessage = pi.last_payment_error?.message ?? null;
    declineCode = pi.last_payment_error?.decline_code ?? null;

    const charge = pi.latest_charge;
    if (typeof charge === "object" && charge) {
      const card = charge.payment_method_details?.card;
      cardBrand = card?.brand ?? null;
      cardLast4 = card?.last4 ?? null;
    }
  }

  const amountTotal =
    typeof session.amount_total === "number"
      ? (session.amount_total / 100).toFixed(2)
      : "—";

  const humanDecline =
    declineMessage ??
    (declineCode
      ? declineCode.replace(/_/g, " ").toLowerCase()
      : null);

  return {
    id: session.id,
    created: session.created * 1000,
    currency: (session.currency ?? "").toUpperCase(),
    paymentStatus: session.payment_status ?? "unknown",
    /** open / complete / expired */
    status: session.status ?? "",
    customerEmail:
      session.customer_details?.email ?? session.customer_email ?? null,
    amountTotal,
    checkoutKind: session.metadata?.checkout_kind ?? "unknown",
    declineMessage: humanDecline,
    declineCode,
    /** Brand + last4 only — Stripe never exposes full PAN to merchants */
    cardBrand,
    cardLast4,
  };
}

export async function GET() {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({
      rows: [],
      warning: "Stripe not configured (set STRIPE_SECRET_KEY).",
    });
  }

  const list = await stripe.checkout.sessions.list({ limit: 35 });
  const rows = await Promise.all(
    list.data.map((s) => summarizeSession(stripe, s)),
  );

  rows.sort((a, b) => b.created - a.created);

  return NextResponse.json({ rows });
}
