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

/** Stripe Customer ids look like `cus_…` — keep ASCII trim for storage. */
export function sanitizeStripeCustomerId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s.startsWith("cus_") || s.length < 8 || s.length > 64) return null;
  return s.slice(0, 64);
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

export type UpsertCustomerPatch = {
  fullName?: string | null;
  phone?: string | null;
  stripeCustomerId?: string | null;
};

/**
 * Creates or updates a customer row; prefers filling empty name/phone/stripe id with new data.
 */
export async function upsertCustomerForOrder(
  db: PostgresJsDatabase<typeof schema>,
  emailRaw: string | null | undefined,
  patch: UpsertCustomerPatch,
): Promise<number | null> {
  const email = normalizeCustomerEmail(emailRaw);
  if (!email) return null;

  const fullName = patch.fullName?.trim().slice(0, 280) || null;
  const phone = patch.phone?.trim().slice(0, 48) || null;
  const stripeIn = sanitizeStripeCustomerId(patch.stripeCustomerId);

  const existing = await db
    .select({
      id: customers.id,
      fullName: customers.fullName,
      phone: customers.phone,
      stripeCustomerId: customers.stripeCustomerId,
    })
    .from(customers)
    .where(eq(customers.email, email))
    .limit(1);

  const now = new Date();

  if (existing[0]) {
    const nextName = mergeText(existing[0].fullName, fullName, 280);
    const nextPhone = mergeText(existing[0].phone, phone, 48);
    const existingStripe = sanitizeStripeCustomerId(
      existing[0].stripeCustomerId ?? undefined,
    );
    const nextStripe =
      existingStripe ?? stripeIn ?? null;

    await db
      .update(customers)
      .set({
        fullName: nextName,
        phone: nextPhone,
        stripeCustomerId: nextStripe,
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
      stripeCustomerId: stripeIn ?? null,
      updatedAt: now,
    })
    .returning({ id: customers.id });

  return inserted[0]?.id ?? null;
}
