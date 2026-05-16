import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { customers } from "@/lib/db/schema";
import { getOrdersDb } from "@/lib/db/client";
import { ADMIN_DB_SCHEMA_HINT } from "@/lib/admin-db-schema-hint";
import { isPgUndefinedColumnError, parseRouteIdParam } from "@/lib/admin-api-params";
import { getCustomerByIdForAdmin } from "@/lib/db/order-admin-queries";
import { requireAdminOr401 } from "@/lib/require-admin-session";

export const dynamic = "force-dynamic";

function serialize(data: NonNullable<Awaited<ReturnType<typeof getCustomerByIdForAdmin>>>) {
  const { customer, orders: ords } = data;
  const cAt =
    customer.createdAt instanceof Date
      ? customer.createdAt.toISOString()
      : new Date(customer.createdAt as unknown as string).toISOString();
  const uAt =
    customer.updatedAt instanceof Date
      ? customer.updatedAt.toISOString()
      : new Date(customer.updatedAt as unknown as string).toISOString();

  return {
    customer: {
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      phone: customer.phone,
      notes: customer.notes,
      stripeCustomerId: customer.stripeCustomerId ?? null,
      createdAtIso: cAt,
      updatedAtIso: uAt,
    },
    orders: ords.map((o) => ({
      id: o.id,
      createdAtIso:
        o.createdAt instanceof Date
          ? o.createdAt.toISOString()
          : new Date(o.createdAt as unknown as string).toISOString(),
      amountAud: (o.amountAudCents / 100).toFixed(2),
      currency: o.currency,
      checkoutKind: o.checkoutKind,
      title: o.title,
      reference: o.reference,
      fulfillmentStatus: o.fulfillmentStatus,
      stripePaymentIntentId: o.stripePaymentIntentId,
    })),
  };
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
    const data = await getCustomerByIdForAdmin(num);
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(serialize(data));
  } catch (e) {
    console.error("[api/admin/customers/[id]] GET", e);
    if (isPgUndefinedColumnError(e)) {
      return NextResponse.json(
        {
          error: ADMIN_DB_SCHEMA_HINT,
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Could not load customer." }, { status: 500 });
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

  const notes = (body as { notes?: unknown }).notes;
  if (typeof notes !== "string") {
    return NextResponse.json({ error: "Expected notes string." }, { status: 400 });
  }

  try {
    const updated = await db
      .update(customers)
      .set({ notes: notes.trim().slice(0, 8000), updatedAt: new Date() })
      .where(eq(customers.id, num))
      .returning({ id: customers.id });

    if (!updated.length) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/admin/customers/[id]] PATCH", e);
    if (isPgUndefinedColumnError(e)) {
      return NextResponse.json(
        {
          error: ADMIN_DB_SCHEMA_HINT,
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Could not update customer." }, { status: 500 });
  }
}
