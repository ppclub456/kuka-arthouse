import { NextResponse } from "next/server";
import { listPayLinksForAdmin } from "@/lib/db/pay-link-repo";
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
      warning: "DATABASE_URL is not set — no payment-link rows stored.",
    });
  }

  const rows = await listPayLinksForAdmin(150);

  return NextResponse.json({
    rows: rows.map((r) => ({
      code: r.code,
      title: r.title,
      reference: r.reference,
      mode: r.mode,
      amountAud: (r.amountAudCents / 100).toFixed(2),
      viewCount: r.viewCount,
      firstViewedAt: r.firstViewedAt?.toISOString() ?? null,
      lastViewedAt: r.lastViewedAt?.toISOString() ?? null,
      paidAt: r.paidAt?.toISOString() ?? null,
      stripePaymentIntentId: r.stripePaymentIntentId,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    })),
  });
}
