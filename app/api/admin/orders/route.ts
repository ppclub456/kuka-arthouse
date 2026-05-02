import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { orders } from "@/lib/db/schema";
import { getOrdersDb } from "@/lib/db/client";
import { requireAdminOr401 } from "@/lib/require-admin-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const db = getOrdersDb();
  if (!db) {
    return NextResponse.json({
      rows: [],
      warning:
        "DATABASE_URL is not set — paid orders are not archived locally yet. Configure Postgres (Neon/Supabase) and push the Drizzle schema (see drizzle/0000_orders.sql).",
    });
  }

  const rows = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      stripePaymentIntentId: orders.stripePaymentIntentId,
      stripeChargeId: orders.stripeChargeId,
      amountAudCents: orders.amountAudCents,
      currency: orders.currency,
      status: orders.status,
      checkoutKind: orders.checkoutKind,
      adminMode: orders.adminMode,
      title: orders.title,
      reference: orders.reference,
      customerEmail: orders.customerEmail,
      productId: orders.productId,
      receiptUrl: orders.receiptUrl,
      subtotalAudCents: orders.subtotalAudCents,
      tipAudCents: orders.tipAudCents,
      shippingAudCents: orders.shippingAudCents,
      lineCount: orders.lineCount,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(150);

  return NextResponse.json({
    rows: rows.map((r) => ({
      ...r,
      createdAtIso: r.createdAt?.toISOString() ?? null,
      amountAud: (r.amountAudCents / 100).toFixed(2),
    })),
  });
}
