import { NextResponse } from "next/server";
import { isPgUndefinedColumnError } from "@/lib/admin-api-params";
import { backfillCustomersFromOrders } from "@/lib/db/backfill-customers-from-orders";
import { getOrdersDb } from "@/lib/db/client";
import { requireAdminOr401 } from "@/lib/require-admin-session";

export const dynamic = "force-dynamic";

/** Idempotent: create/update customers from orders and set `orders.customer_id`. */
export async function POST() {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  if (!getOrdersDb()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    );
  }

  try {
    const result = await backfillCustomersFromOrders();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[api/admin/customers/backfill]", e);
    if (isPgUndefinedColumnError(e)) {
      return NextResponse.json(
        {
          error:
            "Database schema is out of date. Run npm run db:push (or apply drizzle/0002 and 0003 SQL files).",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Backfill failed." },
      { status: 500 },
    );
  }
}
