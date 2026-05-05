import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { orders } from "@/lib/db/schema";
import { getOrdersDb } from "@/lib/db/client";
import { getOrderByIdForAdmin } from "@/lib/db/order-admin-queries";
import { requireAdminOr401 } from "@/lib/require-admin-session";

export const dynamic = "force-dynamic";

const FULFILL = new Set([
  "unfulfilled",
  "processing",
  "fulfilled",
  "cancelled",
  "refunded",
]);

function serializeOrderDetail(data: NonNullable<Awaited<ReturnType<typeof getOrderByIdForAdmin>>>) {
  const { order, customer } = data;
  return {
    order: {
      id: order.id,
      createdAtIso: order.createdAt.toISOString(),
      stripePaymentIntentId: order.stripePaymentIntentId,
      stripeChargeId: order.stripeChargeId,
      amountAud: (order.amountAudCents / 100).toFixed(2),
      currency: order.currency,
      status: order.status,
      checkoutKind: order.checkoutKind,
      adminMode: order.adminMode,
      title: order.title,
      reference: order.reference,
      customerEmail: order.customerEmail,
      productId: order.productId,
      receiptUrl: order.receiptUrl,
      subtotalAudCents: order.subtotalAudCents,
      tipAudCents: order.tipAudCents,
      shippingAudCents: order.shippingAudCents,
      lineCount: order.lineCount,
      customerId: order.customerId,
      fulfillmentStatus: order.fulfillmentStatus,
      internalNote: order.internalNote,
      payLinkCode: order.payLinkCode,
      shippingName: order.shippingName,
      shippingPhone: order.shippingPhone,
      shippingLine1: order.shippingLine1,
      shippingLine2: order.shippingLine2,
      shippingCity: order.shippingCity,
      shippingPostal: order.shippingPostal,
      shippingCountry: order.shippingCountry,
      billingName: order.billingName,
      billingPhone: order.billingPhone,
      billingLine1: order.billingLine1,
      billingLine2: order.billingLine2,
      billingCity: order.billingCity,
      billingPostal: order.billingPostal,
      billingCountry: order.billingCountry,
      cartLines: order.cartLines,
    },
    customer: customer
      ? {
          id: customer.id,
          email: customer.email,
          fullName: customer.fullName,
          phone: customer.phone,
          notes: customer.notes,
        }
      : null,
  };
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const { id } = await ctx.params;
  const num = Number.parseInt(id, 10);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const data = await getOrderByIdForAdmin(num);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(serializeOrderDetail(data));
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const db = getOrdersDb();
  if (!db) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }

  const { id } = await ctx.params;
  const num = Number.parseInt(id, 10);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as { fulfillmentStatus?: unknown; internalNote?: unknown };
  const patch: Partial<typeof orders.$inferInsert> = {};

  if (typeof b.fulfillmentStatus === "string") {
    const s = b.fulfillmentStatus.trim().toLowerCase();
    if (!FULFILL.has(s)) {
      return NextResponse.json({ error: "Invalid fulfillmentStatus." }, { status: 400 });
    }
    patch.fulfillmentStatus = s;
  }
  if (typeof b.internalNote === "string") {
    patch.internalNote = b.internalNote.trim().slice(0, 4000);
  }

  if (patch.fulfillmentStatus == null && patch.internalNote == null) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await db.update(orders).set(patch).where(eq(orders.id, num)).returning({
    id: orders.id,
  });

  if (!updated.length) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
