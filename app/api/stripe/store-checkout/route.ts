import { NextResponse } from "next/server";
import { appBaseUrl } from "@/lib/checkout-base-url";
import { pricingStoreCheckout } from "@/lib/pricing-store";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

type Body = {
  lines: { productId: string; quantity: number }[];
  tipAmountAud?: number;
  customerEmail?: string;
};

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured (STRIPE_SECRET_KEY)." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { items, feeAud, subtotalAud, tipAud, totalAud } =
      pricingStoreCheckout(body.lines ?? [], body.tipAmountAud ?? 0);

    if (totalAud < 0.5) {
      return NextResponse.json(
        { error: "Order total must be at least A$0.50 for card payments." },
        { status: 400 },
      );
    }

    const base = appBaseUrl(request.headers);

    const email = String(body.customerEmail ?? "").trim();

    const lineItems = items.map((it) => ({
      quantity: it.quantity,
      price_data: {
        currency: "aud" as const,
        product_data: {
          name: it.title,
          ...(it.imageSrc ? { images: [it.imageSrc] } : {}),
        },
        unit_amount: Math.round(it.unitAud * 100),
      },
    }));

    if (feeAud >= 0.005) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "aud" as const,
          product_data: { name: "Processing fee (8%)" },
          unit_amount: Math.round(feeAud * 100),
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "aud",
      line_items: lineItems,
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout`,
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      ...(email.includes("@") ? { customer_email: email } : {}),
      metadata: {
        checkout_kind: "store",
        subtotal_aud: subtotalAud.toFixed(2),
        tip_aud: tipAud.toFixed(2),
        fee_aud: feeAud.toFixed(2),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
