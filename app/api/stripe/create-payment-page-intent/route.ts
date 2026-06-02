import { NextResponse } from "next/server";
import { countryLabelToIso } from "@/lib/country-iso";
import { pricingPaymentPageCheckout } from "@/lib/pricing-payment-page";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

type Addr = {
  name?: string;
  line1?: string;
  city?: string;
  postal_code?: string;
  countryLabel?: string;
};

type Body = {
  productId?: string;
  amountAud?: number;
  orderNumber?: string;
  shipping?: {
    email?: string;
    name?: string;
    phone?: string;
    line1?: string;
    city?: string;
    postal_code?: string;
    countryLabel?: string;
  };
  billing_same_as_shipping?: boolean;
  billing_address?: Addr;
};

function trim(max: number, s: string): string {
  return s.trim().slice(0, max);
}

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

export async function POST(request: Request) {
  const stripe = getStripe();
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (!stripe || !pk) {
    return NextResponse.json(
      { error: "Payments are temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const productId = trim(120, String(body.productId ?? ""));
  if (!productId) {
    return NextResponse.json({ error: "Please select a product." }, { status: 400 });
  }

  const orderNumber = trim(180, String(body.orderNumber ?? ""));
  if (orderNumber.length < 1) {
    return NextResponse.json({ error: "Please enter your order number." }, { status: 400 });
  }

  let priced: ReturnType<typeof pricingPaymentPageCheckout>;
  try {
    priced = pricingPaymentPageCheckout(productId, Number(body.amountAud));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid payment amount.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const s = body.shipping ?? {};
  const email = trim(320, String(s.email ?? ""));
  const shippingName = trim(240, String(s.name ?? ""));
  const shippingLine1 = trim(280, String(s.line1 ?? ""));
  const shippingCity = trim(120, String(s.city ?? ""));
  const shippingPostal = trim(40, String(s.postal_code ?? ""));
  const shippingCountryIso = countryLabelToIso(
    String(s.countryLabel ?? "Australia"),
  );
  const phone = trim(40, String(s.phone ?? ""));

  if (
    !email.includes("@") ||
    shippingName.length < 2 ||
    shippingLine1.length < 4 ||
    shippingCity.length < 2
  ) {
    return NextResponse.json(
      {
        error:
          "Please fill in shipping: email, recipient name, street address, and city.",
      },
      { status: 400 },
    );
  }

  const billingSameAsShipping =
    typeof body.billing_same_as_shipping === "boolean"
      ? body.billing_same_as_shipping
      : true;

  let billingName = shippingName;
  let billingLine1 = shippingLine1;
  let billingCity = shippingCity;
  let billingPostal = shippingPostal;
  let billingCountryIso = shippingCountryIso;

  if (!billingSameAsShipping) {
    const b = body.billing_address ?? {};
    billingName = trim(240, String(b.name ?? ""));
    billingLine1 = trim(280, String(b.line1 ?? ""));
    billingCity = trim(120, String(b.city ?? ""));
    billingPostal = trim(40, String(b.postal_code ?? ""));
    billingCountryIso = countryLabelToIso(
      String(b.countryLabel ?? "Australia"),
    );

    if (
      billingName.length < 2 ||
      billingLine1.length < 4 ||
      billingCity.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Please fill in billing: name on card/account, street address, and city.",
        },
        { status: 400 },
      );
    }
  }

  const line = priced.items[0];
  const stripeDescription =
    `Kuka Arthouse — ${line.title}`.slice(0, 200) || "Kuka Arthouse payment";

  const metaBase: Record<string, string> = {
    checkout_kind: "payment_page",
    order_flow: "payment_page",
    product_id: productId,
    payment_reference: orderNumber.slice(0, 180),
    subtotal_aud: priced.subtotalAud.toFixed(2),
    shipping_aud: "0.00",
    line_count: "1",
    billing_same_as_shipping: billingSameAsShipping ? "true" : "false",
    shipping_name: shippingName.slice(0, 120),
    shipping_line1: shippingLine1.slice(0, 140),
    shipping_city: shippingCity.slice(0, 80),
    shipping_postal: shippingPostal.slice(0, 20),
    shipping_country: shippingCountryIso.slice(0, 12),
    billing_name: billingName.slice(0, 120),
    billing_line1: billingLine1.slice(0, 140),
    billing_city: billingCity.slice(0, 80),
    billing_postal: billingPostal.slice(0, 20),
    billing_country: billingCountryIso.slice(0, 12),
    ...(phone ? { billing_phone: phone.slice(0, 32) } : {}),
    cart_lines: compactCartJson(priced.items),
  };

  try {
    const pi = await stripe.paymentIntents.create({
      amount: Math.round(priced.totalAud * 100),
      currency: "aud",
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
      description: stripeDescription,
      metadata: metaBase,
      shipping: {
        name: shippingName,
        phone: phone || undefined,
        address: {
          line1: shippingLine1,
          city: shippingCity,
          postal_code: shippingPostal || undefined,
          country: shippingCountryIso,
        },
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
      totalAud: priced.totalAud,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    console.error("[create-payment-page-intent]", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
