import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { recordSucceededPaymentIntent } from "@/lib/db/record-order-from-pi";
import { markPayLinkPaidFromPaymentIntent } from "@/lib/db/pay-link-repo";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !whSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  const body = await request.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const coarse = event.data.object as Stripe.PaymentIntent;
      try {
        const pi = await stripe.paymentIntents.retrieve(coarse.id, {
          expand: ["latest_charge"],
        });
        await recordSucceededPaymentIntent(pi);
        await markPayLinkPaidFromPaymentIntent(pi);
      } catch (e) {
        console.error("[stripe webhook] archive order failed:", e);
        return NextResponse.json(
          { error: "Persist failed — will retry Stripe delivery" },
          { status: 500 },
        );
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
