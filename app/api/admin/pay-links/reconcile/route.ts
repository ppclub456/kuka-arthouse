import { and, desc, eq, ilike, isNotNull, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { orders, payLinks } from "@/lib/db/schema";
import { getOrdersDb } from "@/lib/db/client";
import { normalizePayLinkCode } from "@/lib/db/pay-link-code";
import type { PayLinkOfferRow } from "@/lib/db/pay-link-repo";
import {
  getPayLinkOffer,
  markPayLinkPaidFromPaymentIntent,
} from "@/lib/db/pay-link-repo";
import { requireAdminOr401 } from "@/lib/require-admin-session";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

function pushPiId(acc: string[], raw: string | null | undefined) {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (s.startsWith("pi_") && !acc.includes(s)) acc.push(s);
}

function metaPayLinkCode(pi: Stripe.PaymentIntent): string | null {
  const raw = pi.metadata?.pay_link_code;
  if (typeof raw !== "string" || !raw.trim()) return null;
  return normalizePayLinkCode(raw.trim());
}

/**
 * Decide whether succeeded PI belongs to this pay link row (Stripe metadata may be missing).
 */
async function paymentIntentAuthorizedForCode(
  db: NonNullable<ReturnType<typeof getOrdersDb>>,
  pi: Stripe.PaymentIntent,
  codeNorm: string,
  offer: PayLinkOfferRow,
): Promise<boolean> {
  if (offer.stripePaymentIntentId === pi.id) return true;
  if (metaPayLinkCode(pi) === codeNorm) return true;

  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        isNotNull(orders.payLinkCode),
        eq(orders.stripePaymentIntentId, pi.id),
        ilike(orders.payLinkCode, codeNorm),
      ),
    )
    .limit(1);

  return Boolean(row?.id);
}

/** Direct write when metadata / id matching helpers fail (after we've authorized the PI). */
async function forceSetPayLinkPaid(
  db: NonNullable<ReturnType<typeof getOrdersDb>>,
  codeNorm: string,
  piId: string,
): Promise<boolean> {
  const now = new Date();
  const updated = await db
    .update(payLinks)
    .set({ paidAt: now, stripePaymentIntentId: piId })
    .where(and(eq(payLinks.code, codeNorm), isNull(payLinks.paidAt)))
    .returning({ code: payLinks.code });
  return updated.length > 0;
}

/**
 * If a pay link shows Open but payment succeeded on Stripe for that code/link row,
 * re-fetch PI(s), verify association, mark paid_at.
 */
export async function POST(request: Request) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const db = getOrdersDb();
  if (!db) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const codeRaw =
    typeof (body as { code?: unknown }).code === "string"
      ? (body as { code: string }).code
      : "";
  const code = normalizePayLinkCode(codeRaw);
  if (!code.length) {
    return NextResponse.json({ error: "Missing or invalid code." }, { status: 400 });
  }

  const offer = await getPayLinkOffer(code);
  if (!offer) {
    return NextResponse.json({ error: "Payment link not found." }, { status: 404 });
  }
  if (offer.paidAt) {
    return NextResponse.json({
      ok: true,
      message: "Already marked paid.",
      paidAtIso: offer.paidAt.toISOString(),
    });
  }

  const piCandidates: string[] = [];

  const archivedForCode = await db
    .select({ stripePaymentIntentId: orders.stripePaymentIntentId })
    .from(orders)
    .where(
      and(isNotNull(orders.payLinkCode), ilike(orders.payLinkCode, code)),
    )
    .orderBy(desc(orders.createdAt))
    .limit(30);

  for (const row of archivedForCode) pushPiId(piCandidates, row.stripePaymentIntentId);

  pushPiId(piCandidates, offer.stripePaymentIntentId);

  if (!piCandidates.length) {
    return NextResponse.json(
      {
        error:
          "No Stripe PaymentIntent is linked locally (no archived order with this pay-link code and no Intent id on this link row). Stripe paid the charge, but this app never stored the PI id.",
      },
      { status: 404 },
    );
  }

  const tried: Array<{ piId: string; status: string | null; rejected?: string }> = [];

  for (const piId of piCandidates) {
    let pi: Stripe.PaymentIntent;
    try {
      pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Stripe retrieve failed.";
      tried.push({ piId, status: null, rejected: msg });
      continue;
    }

    tried.push({ piId, status: pi.status });

    if (pi.status !== "succeeded") {
      continue;
    }

    const authorized = await paymentIntentAuthorizedForCode(db, pi, code, offer);

    if (!authorized) {
      tried[tried.length - 1].rejected =
        "Intent not linked by metadata, intent row id, nor archived order for this code.";
      continue;
    }

    await markPayLinkPaidFromPaymentIntent(pi);

    let after = await getPayLinkOffer(code);
    if (!after?.paidAt) {
      const forced = await forceSetPayLinkPaid(db, code, pi.id);
      if (forced) {
        after = await getPayLinkOffer(code);
      }
    }

    if (!after?.paidAt) {
      return NextResponse.json(
        {
          error: `Mark paid failed unexpectedly after validating PaymentIntent ${pi.id}.`,
          tried,
          stripePaymentIntentId: pi.id,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Payment order link marked paid.",
      paidAtIso: after.paidAt.toISOString(),
      stripePaymentIntentId: after.stripePaymentIntentId ?? pi.id,
      triedStripeIntentIds: tried.map((t) => t.piId),
    });
  }

  return NextResponse.json(
    {
      error:
        "No succeeded Stripe PaymentIntent found among stored candidates, or Stripe keys point at a different account than the payer used.",
      tried,
      candidates: piCandidates,
    },
    { status: 409 },
  );
}
