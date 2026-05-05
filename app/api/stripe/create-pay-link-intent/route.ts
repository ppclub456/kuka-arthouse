import { NextResponse } from "next/server";
import {
  attachPayLinkStripeIntent,
  getPayLinkOffer,
} from "@/lib/db/pay-link-repo";
import { normalizePayLinkCode } from "@/lib/db/pay-link-code";
import { countryLabelToIso } from "@/lib/country-iso";
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
  code?: string;
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

export async function POST(request: Request) {
  const stripe = getStripe();
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (!stripe || !pk) {
    return NextResponse.json(
      { error: "Stripe is not configured on this server." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const codeRaw = typeof body.code === "string" ? body.code : "";
  const code = normalizePayLinkCode(codeRaw);
  const offer = await getPayLinkOffer(code);
  const now = new Date();

  if (!offer) {
    return NextResponse.json({ error: "Payment link not found." }, { status: 404 });
  }
  if (offer.expiresAt < now) {
    return NextResponse.json({ error: "This payment link has expired." }, { status: 410 });
  }
  if (offer.paidAt) {
    return NextResponse.json(
      { error: "This link is already marked as paid." },
      { status: 410 },
    );
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

  const metaBase: Record<string, string> = {
    checkout_kind: "admin_link",
    admin_mode: offer.mode.slice(0, 48),
    pay_link_code: offer.code,
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
    ...(offer.productId ? { product_id: offer.productId } : {}),
    ...(offer.reference ? { payment_reference: offer.reference.slice(0, 40) } : {}),
    ...(phone ? { billing_phone: phone.slice(0, 32) } : {}),
  };

  try {
    if (offer.stripePaymentIntentId) {
      const ex = await stripe.paymentIntents.retrieve(offer.stripePaymentIntentId);
      const unfinished = [
        "requires_payment_method",
        "requires_confirmation",
        "requires_action",
      ].includes(ex.status);

      if (unfinished && ex.amount === offer.amountAudCents) {
        const mergedMeta: Record<string, string> = {};
        if (ex.metadata) {
          for (const [k, v] of Object.entries(ex.metadata)) {
            if (typeof v === "string") mergedMeta[k] = v;
          }
        }
        Object.assign(mergedMeta, metaBase);

        const updated = await stripe.paymentIntents.update(ex.id, {
          receipt_email: email,
          description: offer.title.slice(0, 200),
          metadata: mergedMeta,
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
        if (updated.client_secret) {
          await attachPayLinkStripeIntent(offer.code, updated.id);
          return NextResponse.json({
            clientSecret: updated.client_secret,
            publishableKey: pk,
          });
        }
      }
    }

    const pi = await stripe.paymentIntents.create({
      amount: offer.amountAudCents,
      currency: "aud",
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
      description: offer.title.slice(0, 200),
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
        { error: "Could not start payment intent." },
        { status: 500 },
      );
    }

    await attachPayLinkStripeIntent(offer.code, pi.id);

    return NextResponse.json({
      clientSecret: pi.client_secret,
      publishableKey: pk,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    console.error("[create-pay-link-intent]", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
