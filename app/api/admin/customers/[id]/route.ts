import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { customers } from "@/lib/db/schema";
import { getOrdersDb } from "@/lib/db/client";
import { getCustomerByIdForAdmin } from "@/lib/db/order-admin-queries";
import { requireAdminOr401 } from "@/lib/require-admin-session";

export const dynamic = "force-dynamic";

function serialize(data: NonNullable<Awaited<ReturnType<typeof getCustomerByIdForAdmin>>>) {
  const { customer, orders: ords } = data;
  return {
    customer: {
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      phone: customer.phone,
      notes: customer.notes,
      createdAtIso: customer.createdAt.toISOString(),
      updatedAtIso: customer.updatedAt.toISOString(),
    },
    orders: ords.map((o) => ({
      id: o.id,
      createdAtIso: o.createdAt.toISOString(),
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
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const { id } = await ctx.params;
  const num = Number.parseInt(id, 10);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const data = await getCustomerByIdForAdmin(num);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(serialize(data));
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

  const notes = (body as { notes?: unknown }).notes;
  if (typeof notes !== "string") {
    return NextResponse.json({ error: "Expected notes string." }, { status: 400 });
  }

  const updated = await db
    .update(customers)
    .set({ notes: notes.trim().slice(0, 8000), updatedAt: new Date() })
    .where(eq(customers.id, num))
    .returning({ id: customers.id });

  if (!updated.length) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
