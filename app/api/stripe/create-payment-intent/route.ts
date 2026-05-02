import { NextResponse } from "next/server";
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
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (!stripe || !pk) {
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const { shippingAud, subtotalAud, tipAud, totalAud, items } =
      pricingStoreCheckout(body.lines ?? [], body.tipAmountAud ?? 0);

    if (totalAud < 0.5) {
      return NextResponse.json(
        { error: "Order total must be at least A$0.50." },
        { status: 400 },
      );
    }

    const email = String(body.customerEmail ?? "").trim();

    const pi = await stripe.paymentIntents.create({
      amount: Math.round(totalAud * 100),
      currency: "aud",
      automatic_payment_methods: { enabled: true },
      receipt_email: email.includes("@") ? email : undefined,
      description: "Kuka Arthouse — store order",
      metadata: {
        checkout_kind: "store",
        subtotal_aud: subtotalAud.toFixed(2),
        tip_aud: tipAud.toFixed(2),
        shipping_aud: shippingAud.toFixed(2),
        line_count: String(items.length),
      },
    });

    if (!pi.client_secret) {
      return NextResponse.json(
        { error: "Could not start payment. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      clientSecret: pi.client_secret,
      publishableKey: pk,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
