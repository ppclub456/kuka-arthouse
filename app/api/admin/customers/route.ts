import { NextResponse } from "next/server";
import { ADMIN_DB_SCHEMA_HINT } from "@/lib/admin-db-schema-hint";
import { isPgUndefinedColumnError } from "@/lib/admin-api-params";
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

  try {
    const rows = await listCustomersForAdmin(Number.isFinite(lim) ? lim : 200);

    return NextResponse.json({
      rows: rows.map((r) => ({
        id: r.id,
      email: r.email,
      fullName: r.fullName,
      phone: r.phone,
      notes: r.notes,
      stripeCustomerId: r.stripeCustomerId,
      createdAtIso: r.createdAt.toISOString(),
        updatedAtIso: r.updatedAt.toISOString(),
        orderCount: r.orderCount,
        lastOrderAtIso: r.lastOrderAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    console.error("[api/admin/customers] GET", e);
    if (isPgUndefinedColumnError(e)) {
      return NextResponse.json(
        {
          rows: [],
          error: ADMIN_DB_SCHEMA_HINT,
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { rows: [], error: "Could not load customers." },
      { status: 500 },
    );
  }
}
