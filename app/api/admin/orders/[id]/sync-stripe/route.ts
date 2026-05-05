import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { orders } from "@/lib/db/schema";
import { getOrdersDb } from "@/lib/db/client";
import { upsertCustomerForOrder } from "@/lib/db/customer-repo";
import { isPgUndefinedColumnError, parseRouteIdParam } from "@/lib/admin-api-params";
import { requireAdminOr401 } from "@/lib/require-admin-session";
import { getStripe } from "@/lib/stripe-server";
import { buildOrderContactPatchFromPaymentIntent } from "@/lib/stripe-order-contact";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  ctx: { params?: Promise<Record<string, string | string[] | undefined>> },
) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const db = getOrdersDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL on the server." },
      { status: 503 },
    );
  }

  const num = await parseRouteIdParam(ctx);
  if (num == null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let stripePaymentIntentId: string | null = null;
  let priorCustomerId: number | null = null;

  try {
    const rows = await db
      .select({
        stripePaymentIntentId: orders.stripePaymentIntentId,
        customerId: orders.customerId,
      })
      .from(orders)
      .where(eq(orders.id, num))
      .limit(1);
    stripePaymentIntentId = rows[0]?.stripePaymentIntentId ?? null;
    priorCustomerId = rows[0]?.customerId ?? null;
  } catch (e) {
    console.error("[api/admin/orders/sync-stripe] load", e);
    if (isPgUndefinedColumnError(e)) {
      return NextResponse.json(
        { error: "Database schema out of date. Run npm run db:push." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Could not load order." }, { status: 500 });
  }

  if (!stripePaymentIntentId) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  try {
    const pi = await stripe.paymentIntents.retrieve(stripePaymentIntentId, {
      expand: ["latest_charge"],
    });
    const contact = buildOrderContactPatchFromPaymentIntent(pi);

    let customerId: number | null = priorCustomerId;
    try {
      const cid = await upsertCustomerForOrder(db, contact.customerEmail, {
        fullName: contact.shippingName ?? contact.billingName,
        phone: contact.shippingPhone ?? contact.billingPhone,
        stripeCustomerId: contact.stripeCustomerId,
      });
      if (cid != null) customerId = cid;
    } catch (e) {
      console.error("[api/admin/orders/sync-stripe] customer upsert", e);
    }

    const updated = await db
      .update(orders)
      .set({
        customerEmail: contact.customerEmail,
        stripeChargeId: contact.stripeChargeId,
        receiptUrl: contact.receiptUrl,
        customerId,
        shippingName: contact.shippingName,
        shippingPhone: contact.shippingPhone,
        shippingLine1: contact.shippingLine1,
        shippingLine2: contact.shippingLine2,
        shippingCity: contact.shippingCity,
        shippingPostal: contact.shippingPostal,
        shippingCountry: contact.shippingCountry,
        billingName: contact.billingName,
        billingPhone: contact.billingPhone,
        billingLine1: contact.billingLine1,
        billingLine2: contact.billingLine2,
        billingCity: contact.billingCity,
        billingPostal: contact.billingPostal,
        billingCountry: contact.billingCountry,
      })
      .where(eq(orders.id, num))
      .returning({ id: orders.id });

    if (!updated.length) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      message: "Contact and shipping merged from Stripe PaymentIntent.",
    });
  } catch (e) {
    console.error("[api/admin/orders/sync-stripe]", e);
    return NextResponse.json(
      {
        error:
          typeof e === "object" &&
          e &&
          "message" in e &&
          typeof (e as { message: unknown }).message === "string"
            ? (e as { message: string }).message
            : "Stripe fetch or update failed.",
      },
      { status: 500 },
    );
  }
}
