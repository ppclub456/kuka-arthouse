import { NextResponse } from "next/server";
import { getOrdersDb } from "@/lib/db/client";
import { listOrdersForAdmin } from "@/lib/db/order-admin-queries";
import { requireAdminOr401 } from "@/lib/require-admin-session";

export const dynamic = "force-dynamic";

function serializeRow(r: Awaited<ReturnType<typeof listOrdersForAdmin>>[number]) {
  return {
    id: r.id,
    createdAtIso: r.createdAt?.toISOString() ?? null,
    stripePaymentIntentId: r.stripePaymentIntentId,
    stripeChargeId: r.stripeChargeId,
    amountAud: (r.amountAudCents / 100).toFixed(2),
    currency: r.currency,
    status: r.status,
    checkoutKind: r.checkoutKind,
    adminMode: r.adminMode,
    title: r.title,
    reference: r.reference,
    customerEmail: r.customerEmail,
    productId: r.productId,
    receiptUrl: r.receiptUrl,
    subtotalAudCents: r.subtotalAudCents,
    tipAudCents: r.tipAudCents,
    shippingAudCents: r.shippingAudCents,
    lineCount: r.lineCount,
    customerId: r.customerId,
    fulfillmentStatus: r.fulfillmentStatus,
    internalNote: r.internalNote,
    payLinkCode: r.payLinkCode,
    shippingName: r.shippingName,
    shippingPhone: r.shippingPhone,
    shippingLine1: r.shippingLine1,
    shippingLine2: r.shippingLine2,
    shippingCity: r.shippingCity,
    shippingPostal: r.shippingPostal,
    shippingCountry: r.shippingCountry,
    billingName: r.billingName,
    billingPhone: r.billingPhone,
    billingLine1: r.billingLine1,
    billingLine2: r.billingLine2,
    billingCity: r.billingCity,
    billingPostal: r.billingPostal,
    billingCountry: r.billingCountry,
    cartLines: r.cartLines,
  };
}

export async function GET(request: Request) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const db = getOrdersDb();
  if (!db) {
    return NextResponse.json({
      rows: [],
      warning:
        "DATABASE_URL is not set — paid orders are not archived locally. Configure Postgres (see drizzle/0000_orders.sql).",
    });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || undefined;
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 200;

  const rows = await listOrdersForAdmin({
    q,
    limit: Number.isFinite(limit) ? limit : 200,
  });

  return NextResponse.json({
    rows: rows.map(serializeRow),
  });
}
