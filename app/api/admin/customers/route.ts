import { NextResponse } from "next/server";
import { getOrdersDb } from "@/lib/db/client";
import { listCustomersForAdmin } from "@/lib/db/order-admin-queries";
import { requireAdminOr401 } from "@/lib/require-admin-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const db = getOrdersDb();
  if (!db) {
    return NextResponse.json({
      rows: [],
      warning: "DATABASE_URL is not set — configure Postgres.",
    });
  }

  const url = new URL(request.url);
  const lim = Number.parseInt(url.searchParams.get("limit") ?? "200", 10);

  const rows = await listCustomersForAdmin(Number.isFinite(lim) ? lim : 200);

  return NextResponse.json({
    rows: rows.map((r) => ({
      id: r.id,
      email: r.email,
      fullName: r.fullName,
      phone: r.phone,
      notes: r.notes,
      createdAtIso: r.createdAt.toISOString(),
      updatedAtIso: r.updatedAt.toISOString(),
      orderCount: r.orderCount,
      lastOrderAtIso: r.lastOrderAt?.toISOString() ?? null,
    })),
  });
}
