import { NextResponse } from "next/server";
import {
  resolveAdminStripeQuote,
  type AdminQuotePayload,
} from "@/lib/admin-quote";
import { appBaseUrl } from "@/lib/checkout-base-url";
import { requireAdminOr401 } from "@/lib/require-admin-session";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured (STRIPE_SECRET_KEY)." },
      { status: 503 },
    );
  }

  let body: AdminQuotePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const q = resolveAdminStripeQuote(body);
    if (q.lineTotalAud < 0.5) {
      return NextResponse.json(
        { error: "Amount must be at least A$0.50 for card payments." },
        { status: 400 },
      );
    }

    const base = appBaseUrl(request.headers);

    const lineItem = {
      quantity: q.quantity,
      price_data: {
        currency: "aud" as const,
        product_data: {
          name: q.title.slice(0, 120),
          ...(q.imageSrcs.length ? { images: [q.imageSrcs[0]] } : {}),
        },
        unit_amount: Math.round(q.unitAud * 100),
      },
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "aud",
      line_items: [lineItem],
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/`,
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      metadata: {
        checkout_kind: "admin_link",
        admin_mode: q.mode,
        ...(q.productId ? { product_id: q.productId } : {}),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
