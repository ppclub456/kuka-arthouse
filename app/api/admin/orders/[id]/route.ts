import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { orders } from "@/lib/db/schema";
import { getOrdersDb } from "@/lib/db/client";
import { isPgUndefinedColumnError, parseRouteIdParam } from "@/lib/admin-api-params";
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
  const createdAt =
    order.createdAt instanceof Date
      ? order.createdAt.toISOString()
      : new Date(order.createdAt as unknown as string).toISOString();

  return {
    order: {
      id: order.id,
      createdAtIso: createdAt,
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
      cartLines: normalizeCartLines(order.cartLines),
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

function normalizeCartLines(raw: unknown) {
  if (!raw || !Array.isArray(raw)) return null;
  const out: Array<{
    productId: string;
    title: string;
    quantity: number;
    unitAud: number;
    lineTotalAud: number;
  }> = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    out.push({
      productId: String(o.productId ?? ""),
      title: String(o.title ?? ""),
      quantity: Number(o.quantity) || 0,
      unitAud: Number(o.unitAud) || 0,
      lineTotalAud: Number(o.lineTotalAud) || 0,
    });
  }
  return out.length > 0 ? out : null;
}

export async function GET(
  _request: Request,
  ctx: { params?: Promise<Record<string, string | string[] | undefined>> },
) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

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

  try {
    const data = await getOrderByIdForAdmin(num);
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(serializeOrderDetail(data));
  } catch (e) {
    console.error("[api/admin/orders/[id]] GET", e);
    if (isPgUndefinedColumnError(e)) {
      return NextResponse.json(
        {
          error:
            "Database is missing new columns. Run migration: drizzle/0002_customers_orders_admin.sql or npm run db:push",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Could not load order." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  ctx: { params?: Promise<Record<string, string | string[] | undefined>> },
) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const db = getOrdersDb();
  if (!db) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }

  const num = await parseRouteIdParam(ctx);
  if (num == null) {
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

  try {
    const updated = await db.update(orders).set(patch).where(eq(orders.id, num)).returning({
      id: orders.id,
    });

    if (!updated.length) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/admin/orders/[id]] PATCH", e);
    if (isPgUndefinedColumnError(e)) {
      return NextResponse.json(
        {
          error:
            "Database is missing new columns. Run migration: drizzle/0002_customers_orders_admin.sql or npm run db:push",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Could not update order." }, { status: 500 });
  }
}
