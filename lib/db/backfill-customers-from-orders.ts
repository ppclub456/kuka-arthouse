import { desc, isNotNull, sql } from "drizzle-orm";
import { normalizeCustomerEmail, upsertCustomerForOrder } from "@/lib/db/customer-repo";
import { orders } from "@/lib/db/schema";
import { getOrdersDb } from "@/lib/db/client";

/**
 * Upserts {@link customers} from archived {@link orders} rows and attaches `customer_id`
 * wherever `customer_email` matches (case-insensitive). Safe to run multiple times (idempotent).
 */
export async function backfillCustomersFromOrders(): Promise<{
  emailsProcessed: number;
  ordersLinked: number;
}> {
  const db = getOrdersDb();
  if (!db) throw new Error("DATABASE_URL not configured");

  const all = await db
    .select()
    .from(orders)
    .where(isNotNull(orders.customerEmail))
    .orderBy(desc(orders.createdAt));

  /** Key: normalized lowercase email */
  const grouped = new Map<string, (typeof orders.$inferSelect)[]>();
  for (const row of all) {
    const norm = normalizeCustomerEmail(row.customerEmail ?? undefined);
    if (!norm) continue;
    const list = grouped.get(norm);
    if (list) list.push(row);
    else grouped.set(norm, [row]);
  }

  let ordersLinked = 0;

  for (const [normEmail, bucket] of grouped) {
    let fullName: string | null = null;
    let phone: string | null = null;
    const sortedNewestFirst = [...bucket].sort((a, b) => {
      const ta =
        a.createdAt instanceof Date
          ? a.createdAt.getTime()
          : new Date(a.createdAt as string).getTime();
      const tb =
        b.createdAt instanceof Date
          ? b.createdAt.getTime()
          : new Date(b.createdAt as string).getTime();
      return tb - ta;
    });

    for (const row of sortedNewestFirst) {
      if (!fullName) {
        fullName =
          row.shippingName?.trim().slice(0, 280) ||
          row.billingName?.trim().slice(0, 280) ||
          null;
      }
      if (!phone) {
        phone =
          row.shippingPhone?.trim().slice(0, 48) ||
          row.billingPhone?.trim().slice(0, 48) ||
          null;
      }
      if (fullName && phone) break;
    }

    const cid = await upsertCustomerForOrder(db, normEmail, {
      fullName,
      phone,
      stripeCustomerId: null,
    });

    if (!cid) continue;

    const touched = await db
      .update(orders)
      .set({ customerId: cid })
      .where(sql`LOWER(TRIM(COALESCE(${orders.customerEmail}, ''))) = ${normEmail}`)
      .returning({ id: orders.id });

    ordersLinked += touched.length;
  }

  return {
    emailsProcessed: grouped.size,
    ordersLinked,
  };
}
