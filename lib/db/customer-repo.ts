import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";
import { customers } from "@/lib/db/schema";

export function normalizeCustomerEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== "string") return null;
  const e = email.trim().toLowerCase().slice(0, 318);
  if (!e.includes("@")) return null;
  return e;
}

function mergeText(
  current: string | null | undefined,
  incoming: string | null | undefined,
  max: number,
): string | null {
  const i = incoming?.trim();
  if (i && i.length > 0) return i.slice(0, max);
  return current ?? null;
}

/**
 * Creates or updates a customer row; prefers filling empty name/phone with new data.
 */
export async function upsertCustomerForOrder(
  db: PostgresJsDatabase<typeof schema>,
  emailRaw: string | null | undefined,
  patch: { fullName?: string | null; phone?: string | null },
): Promise<number | null> {
  const email = normalizeCustomerEmail(emailRaw);
  if (!email) return null;

  const fullName = patch.fullName?.trim().slice(0, 280) || null;
  const phone = patch.phone?.trim().slice(0, 48) || null;

  const existing = await db
    .select({ id: customers.id, fullName: customers.fullName, phone: customers.phone })
    .from(customers)
    .where(eq(customers.email, email))
    .limit(1);

  const now = new Date();

  if (existing[0]) {
    const nextName = mergeText(existing[0].fullName, fullName, 280);
    const nextPhone = mergeText(existing[0].phone, phone, 48);
    await db
      .update(customers)
      .set({
        fullName: nextName,
        phone: nextPhone,
        updatedAt: now,
      })
      .where(eq(customers.id, existing[0].id));
    return existing[0].id;
  }

  const inserted = await db
    .insert(customers)
    .values({
      email,
      fullName,
      phone,
      updatedAt: now,
    })
    .returning({ id: customers.id });

  return inserted[0]?.id ?? null;
}
