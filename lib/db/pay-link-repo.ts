import { and, desc, eq, gte, isNull } from "drizzle-orm";
import type Stripe from "stripe";
import { getOrdersDb } from "@/lib/db/client";
import {
  normalizePayLinkCode,
  payLinkNanoid,
} from "@/lib/db/pay-link-code";
import { payLinks } from "@/lib/db/schema";

const DEFAULT_LINK_TTL_DAYS = 30;

export type PayLinkOfferRow = typeof payLinks.$inferSelect;

function isPgUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}

export async function mintPayLinkRow(args: {
  amountAudCents: number;
  title: string;
  reference?: string | null;
  mode: string;
  productId?: string | null;
  ttlDays?: number;
}): Promise<string> {
  const db = getOrdersDb();
  if (!db) {
    throw new Error(
      "DATABASE_URL is not configured — cannot create short payment links.",
    );
  }
  const ttl = args.ttlDays ?? DEFAULT_LINK_TTL_DAYS;
  const expiresAt = new Date(Date.now() + ttl * 864e5);

  const ref =
    typeof args.reference === "string"
      ? args.reference.trim().slice(0, 180) || null
      : null;
  const prod =
    typeof args.productId === "string"
      ? args.productId.trim().slice(0, 96) || null
      : null;

  for (let attempts = 0; attempts < 16; attempts++) {
    const code = payLinkNanoid();
    try {
      await db.insert(payLinks).values({
        code,
        amountAudCents: args.amountAudCents,
        title: args.title.trim().slice(0, 500),
        reference: ref,
        mode: args.mode.slice(0, 48),
        productId: prod,
        expiresAt,
      });
      return code;
    } catch (e) {
      if (isPgUniqueViolation(e)) continue;
      throw e;
    }
  }
  throw new Error("Could not allocate a payment link code.");
}

export async function getPayLinkOffer(
  rawCode: string,
): Promise<PayLinkOfferRow | null> {
  const db = getOrdersDb();
  if (!db) return null;
  const code = normalizePayLinkCode(rawCode);
  const [row] = await db.select().from(payLinks).where(eq(payLinks.code, code));
  return row ?? null;
}

export async function recordPayLinkPageView(rawCode: string): Promise<void> {
  const db = getOrdersDb();
  if (!db) return;
  const code = normalizePayLinkCode(rawCode);
  const [row] = await db.select().from(payLinks).where(eq(payLinks.code, code));
  if (!row) return;

  await db
    .update(payLinks)
    .set({
      viewCount: row.viewCount + 1,
      firstViewedAt: row.firstViewedAt ?? new Date(),
      lastViewedAt: new Date(),
    })
    .where(eq(payLinks.code, code));
}

export async function attachPayLinkStripeIntent(
  rawCode: string,
  stripePaymentIntentId: string,
): Promise<void> {
  const db = getOrdersDb();
  if (!db) return;
  const code = normalizePayLinkCode(rawCode);
  await db
    .update(payLinks)
    .set({ stripePaymentIntentId })
    .where(eq(payLinks.code, code));
}

export async function markPayLinkPaidFromPaymentIntent(pi: Stripe.PaymentIntent) {
  const db = getOrdersDb();
  if (!db) return;
  if (pi.status !== "succeeded") return;

  const now = new Date();

  const byIntent = await db
    .update(payLinks)
    .set({ paidAt: now })
    .where(and(eq(payLinks.stripePaymentIntentId, pi.id), isNull(payLinks.paidAt)))
    .returning({ code: payLinks.code });

  if (byIntent.length > 0) return;

  const metaCode = pi.metadata?.pay_link_code;
  const codeNorm =
    typeof metaCode === "string" && metaCode.trim()
      ? normalizePayLinkCode(metaCode)
      : null;

  if (!codeNorm) {
    console.warn(
      "[pay_links] succeeded PI did not match a pay_link row by id and has no metadata.pay_link_code:",
      pi.id,
    );
    return;
  }

  const byCode = await db
    .update(payLinks)
    .set({
      paidAt: now,
      stripePaymentIntentId: pi.id,
    })
    .where(and(eq(payLinks.code, codeNorm), isNull(payLinks.paidAt)))
    .returning({ code: payLinks.code });

  if (byCode.length === 0) {
    console.warn(
      "[pay_links] succeeded PI matched no unpaid row by stripePaymentIntentId or code:",
      pi.id,
      codeNorm,
    );
  }
}

/** Remove an unpaid link that is still within its TTL (admin “Open” rows only). */
export async function deleteOpenPayLink(
  rawCode: string,
): Promise<"deleted" | "not_found" | "not_open" | "no_db"> {
  const db = getOrdersDb();
  if (!db) return "no_db";

  const code = normalizePayLinkCode(rawCode);
  const now = new Date();

  const removed = await db
    .delete(payLinks)
    .where(
      and(
        eq(payLinks.code, code),
        isNull(payLinks.paidAt),
        gte(payLinks.expiresAt, now),
      ),
    )
    .returning({ code: payLinks.code });

  if (removed.length > 0) return "deleted";

  const [row] = await db.select({ code: payLinks.code }).from(payLinks).where(eq(payLinks.code, code)).limit(1);
  if (!row) return "not_found";
  return "not_open";
}

/** Admin list ordered by issuance time desc. */
export async function listPayLinksForAdmin(limit = 120) {
  const db = getOrdersDb();
  if (!db) return [];
  return db
    .select()
    .from(payLinks)
    .orderBy(desc(payLinks.createdAt))
    .limit(limit);
}
