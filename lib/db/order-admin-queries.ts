import { desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import { customers, orders } from "@/lib/db/schema";
import { getOrdersDb } from "@/lib/db/client";
import type { OrderCartLineSnapshot } from "@/lib/db/schema";

export type AdminOrderRow = {
  id: number;
  createdAt: Date;
  stripePaymentIntentId: string;
  stripeChargeId: string | null;
  amountAudCents: number;
  currency: string;
  status: string;
  checkoutKind: string | null;
  adminMode: string | null;
  title: string | null;
  reference: string | null;
  customerEmail: string | null;
  productId: string | null;
  receiptUrl: string | null;
  subtotalAudCents: number | null;
  tipAudCents: number | null;
  shippingAudCents: number | null;
  lineCount: number | null;
  customerId: number | null;
  fulfillmentStatus: string | null;
  internalNote: string | null;
  payLinkCode: string | null;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingPostal: string | null;
  shippingCountry: string | null;
  billingName: string | null;
  billingPhone: string | null;
  billingLine1: string | null;
  billingLine2: string | null;
  billingCity: string | null;
  billingPostal: string | null;
  billingCountry: string | null;
  cartLines: OrderCartLineSnapshot[] | null;
};

function mapOrderRow(r: typeof orders.$inferSelect): AdminOrderRow {
  return {
    id: r.id,
    createdAt: r.createdAt,
    stripePaymentIntentId: r.stripePaymentIntentId,
    stripeChargeId: r.stripeChargeId,
    amountAudCents: r.amountAudCents,
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
    cartLines: r.cartLines ?? null,
  };
}

export async function listOrdersForAdmin(opts: {
  q?: string;
  limit?: number;
}): Promise<AdminOrderRow[]> {
  const db = getOrdersDb();
  if (!db) return [];
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 500);
  const q = opts.q?.trim();

  if (q && q.length > 0) {
    /** Strip `%`/`_` so user input cannot broaden SQL ILIKE patterns. */
    const safe = q.replace(/%/g, "").replace(/_/g, "").slice(0, 160).trim();
    if (safe.length === 0) {
      const rows = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit);
      return rows.map(mapOrderRow);
    }
    const pattern = `%${safe}%`;
    const rows = await db
      .select()
      .from(orders)
      .where(
        or(
          ilike(orders.customerEmail, pattern),
          ilike(orders.reference, pattern),
          ilike(orders.title, pattern),
          ilike(orders.stripePaymentIntentId, pattern),
          ilike(orders.payLinkCode, pattern),
        ),
      )
      .orderBy(desc(orders.createdAt))
      .limit(limit);
    return rows.map(mapOrderRow);
  }

  const rows = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit);
  return rows.map(mapOrderRow);
}

export async function getOrderByIdForAdmin(
  id: number,
): Promise<{ order: AdminOrderRow; customer: typeof customers.$inferSelect | null } | null> {
  const db = getOrdersDb();
  if (!db) return null;

  const row = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!row[0]) return null;
  const order = mapOrderRow(row[0]);

  let customer: typeof customers.$inferSelect | null = null;
  if (row[0].customerId != null) {
    const c = await db
      .select()
      .from(customers)
      .where(eq(customers.id, row[0].customerId))
      .limit(1);
    customer = c[0] ?? null;
  }

  return { order, customer };
}

export type AdminCustomerSummary = {
  id: number;
  email: string;
  fullName: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  orderCount: number;
  lastOrderAt: Date | null;
};

export async function listCustomersForAdmin(limit = 200): Promise<AdminCustomerSummary[]> {
  const db = getOrdersDb();
  if (!db) return [];
  const lim = Math.min(Math.max(limit, 1), 500);

  const agg = await db
    .select({
      customerId: orders.customerId,
      orderCount: sql<number>`count(*)::int`,
      lastOrderAt: sql<Date | null>`max(${orders.createdAt})`,
    })
    .from(orders)
    .where(isNotNull(orders.customerId))
    .groupBy(orders.customerId);

  const countMap = new Map<number, { n: number; last: Date | null }>();
  for (const a of agg) {
    if (a.customerId != null) {
      countMap.set(a.customerId, { n: a.orderCount, last: a.lastOrderAt ?? null });
    }
  }

  const rows = await db
    .select()
    .from(customers)
    .orderBy(desc(customers.updatedAt))
    .limit(lim);

  return rows.map((c) => {
    const aggRow = countMap.get(c.id);
    return {
      id: c.id,
      email: c.email,
      fullName: c.fullName,
      phone: c.phone,
      notes: c.notes,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      orderCount: aggRow?.n ?? 0,
      lastOrderAt: aggRow?.last ?? null,
    };
  });
}

export async function getCustomerByIdForAdmin(id: number) {
  const db = getOrdersDb();
  if (!db) return null;
  const c = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!c[0]) return null;
  const ords = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  return { customer: c[0], orders: ords.map(mapOrderRow) };
}
