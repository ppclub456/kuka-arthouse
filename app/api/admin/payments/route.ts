import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { requireAdminOr401 } from "@/lib/require-admin-session";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

function summarizePI(pi: Stripe.PaymentIntent) {
  let cardBrand: string | null = null;
  let cardLast4: string | null = null;

  const err = pi.last_payment_error;
  const declineMessage = err?.message ?? null;
  const declineCode = err?.decline_code ?? null;

  const charge = pi.latest_charge;
  if (typeof charge === "object" && charge) {
    const card = charge.payment_method_details?.card;
    cardBrand = card?.brand ?? null;
    cardLast4 = card?.last4 ?? null;
  }

  const humanDecline =
    declineMessage ??
    (declineCode ? declineCode.replace(/_/g, " ").toLowerCase() : null);

  const paymentStatus =
    pi.status === "succeeded"
      ? "paid"
      : pi.status === "requires_payment_method"
        ? "unpaid"
        : pi.status;

  return {
    id: pi.id,
    created: pi.created * 1000,
    currency: (pi.currency ?? "").toUpperCase(),
    paymentStatus,
    status: pi.status,
    customerEmail: pi.receipt_email ?? null,
    amountTotal: (pi.amount / 100).toFixed(2),
    checkoutKind: pi.metadata?.checkout_kind ?? "unknown",
    declineMessage: humanDecline,
    declineCode,
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

  const list = await stripe.paymentIntents.list({
    limit: 40,
    expand: ["data.latest_charge.payment_method_details.card"],
  });

  const rows = list.data.map((pi) => summarizePI(pi));
  rows.sort((a, b) => b.created - a.created);

  return NextResponse.json({ rows });
}
