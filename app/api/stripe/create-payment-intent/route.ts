import { NextResponse } from "next/server";
import {
  pricingStoreCheckout,
  type StoreCheckoutLineInput,
} from "@/lib/pricing-store";
import { countryLabelToIso } from "@/lib/country-iso";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

type CustomerPayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  street?: string;
  city?: string;
  postal?: string;
  countryLabel?: string;
};

type Body = {
  lines?: StoreCheckoutLineInput[];
  tipAmountAud?: number;
  customerEmail?: string;
  customer?: CustomerPayload;
};

/** Stripe metadata values must stay ≤ ~500 chars. */
function compactCartJson(
  items: Array<{
    productId: string;
    title: string;
    unitAud: number;
    quantity: number;
  }>,
): string {
  const trimmed = items.map((i) => ({
    productId: i.productId,
    title: i.title.slice(0, 80),
    quantity: i.quantity,
    unitAud: i.unitAud,
    lineTotalAud: Math.round(i.unitAud * i.quantity * 100) / 100,
  }));
  let s = JSON.stringify(trimmed);
  if (s.length <= 495) return s;
  const mini = trimmed.map((x) => ({
    productId: x.productId,
    title: x.title.slice(0, 24),
    quantity: x.quantity,
    unitAud: x.unitAud,
    lineTotalAud: x.lineTotalAud,
  }));
  return JSON.stringify(mini).slice(0, 495);
}

function trim(max: number, s: string): string {
  return s.trim().slice(0, max);
}

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

    const email = trim(320, String(body.customerEmail ?? ""));
    const c = body.customer ?? {};
    const firstName = trim(120, String(c.firstName ?? ""));
    const lastName = trim(120, String(c.lastName ?? ""));
    const shippingName = trim(240, `${firstName} ${lastName}`.trim());
    const phone = trim(48, String(c.phone ?? ""));
    const line1 = trim(280, String(c.street ?? ""));
    const city = trim(120, String(c.city ?? ""));
    const postal = trim(48, String(c.postal ?? ""));
    const countryIso = countryLabelToIso(String(c.countryLabel ?? "Australia"));

    if (
      !email.includes("@") ||
      shippingName.length < 2 ||
      line1.length < 4 ||
      city.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Please complete contact & shipping: email, your name, street address, and city.",
        },
        { status: 400 },
      );
    }

    const cartLinesJson = compactCartJson(items);

    const pi = await stripe.paymentIntents.create({
      amount: Math.round(totalAud * 100),
      currency: "aud",
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
      description: "Kuka Arthouse — store order",
      shipping: {
        name: shippingName,
        phone: phone || undefined,
        address: {
          line1: line1,
          city,
          postal_code: postal || undefined,
          country: countryIso,
        },
      },
      metadata: {
        checkout_kind: "store",
        subtotal_aud: subtotalAud.toFixed(2),
        tip_aud: tipAud.toFixed(2),
        shipping_aud: shippingAud.toFixed(2),
        line_count: String(items.length),
        shipping_name: shippingName.slice(0, 120),
        shipping_line1: line1.slice(0, 140),
        shipping_city: city.slice(0, 80),
        shipping_postal: postal.slice(0, 20),
        shipping_country: countryIso.slice(0, 12),
        billing_name: shippingName.slice(0, 120),
        billing_line1: line1.slice(0, 140),
        billing_city: city.slice(0, 80),
        billing_postal: postal.slice(0, 20),
        billing_country: countryIso.slice(0, 12),
        ...(phone ? { billing_phone: phone.slice(0, 32) } : {}),
        cart_lines: cartLinesJson,
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
