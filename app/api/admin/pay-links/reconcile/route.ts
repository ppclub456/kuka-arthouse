import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { orders } from "@/lib/db/schema";
import { getOrdersDb } from "@/lib/db/client";
import { normalizePayLinkCode } from "@/lib/db/pay-link-code";
import {
  getPayLinkOffer,
  markPayLinkPaidFromPaymentIntent,
} from "@/lib/db/pay-link-repo";
import { requireAdminOr401 } from "@/lib/require-admin-session";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

/**
 * If a pay link shows Open but an order was archived for the same code, re-fetch the
 * PaymentIntent from Stripe and run the same “mark paid” logic (PI id + metadata fallback).
 */
export async function POST(request: Request) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const db = getOrdersDb();
  if (!db) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const codeRaw = typeof (body as { code?: unknown }).code === "string"
    ? (body as { code: string }).code
    : "";
  const code = normalizePayLinkCode(codeRaw);
  if (!code) {
    return NextResponse.json({ error: "Missing or invalid code." }, { status: 400 });
  }

  const offer = await getPayLinkOffer(code);
  if (!offer) {
    return NextResponse.json({ error: "Payment link not found." }, { status: 404 });
  }
  if (offer.paidAt) {
    return NextResponse.json({
      ok: true,
      message: "Already marked paid.",
      paidAtIso: offer.paidAt.toISOString(),
    });
  }

  const [orderRow] = await db
    .select({ stripePaymentIntentId: orders.stripePaymentIntentId })
    .from(orders)
    .where(eq(orders.payLinkCode, code))
    .orderBy(desc(orders.createdAt))
    .limit(1);

  const piId = orderRow?.stripePaymentIntentId?.trim();
  if (!piId) {
    return NextResponse.json(
      {
        error:
          "No local order archived with this pay link code yet. Payment may not have webhook-archived.",
      },
      { status: 404 },
    );
  }

  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe retrieve failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  if (pi.status !== "succeeded") {
    return NextResponse.json(
      {
        error: `Stripe PaymentIntent status is ${pi.status}, not succeeded.`,
        stripePaymentIntentId: pi.id,
      },
      { status: 409 },
    );
  }

  await markPayLinkPaidFromPaymentIntent(pi);

  const after = await getPayLinkOffer(code);
  if (!after?.paidAt) {
    return NextResponse.json(
      {
        error:
          "Could not mark paid. Check Stripe metadata pay_link_code on this PaymentIntent.",
        stripePaymentIntentId: pi.id,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Pay link reconciled against Stripe/archived order.",
    paidAtIso: after.paidAt.toISOString(),
    stripePaymentIntentId: after.stripePaymentIntentId ?? pi.id,
  });
}
