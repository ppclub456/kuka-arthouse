import Link from "next/link";
import type { PayLinkClaims } from "@/lib/pay-link-types";
import type { ReactNode } from "react";
import { EmbeddedStripePayment } from "@/components/embedded-stripe-payment";
import { StorePolicyLinks } from "@/components/store-policy-links";
import { formatMoaPrice } from "@/lib/format";
import { getStripe } from "@/lib/stripe-server";
import { STORE_SUPPORT_EMAIL } from "@/lib/store-contact";
import { verifyPaymentLinkToken } from "@/lib/verify-payment-link-token";

type Props = {
  searchParams: Promise<{ p?: string; token?: string }>;
};

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[var(--border-dim)] py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </dt>
      <dd className="text-sm font-medium text-[var(--foreground)]">{children}</dd>
    </div>
  );
}

export default async function PayLinkPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = sp.p?.trim() || sp.token?.trim();

  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";

  if (!raw) {
    return (
      <div className="mx-auto max-w-md flex-1 px-4 py-20 text-center text-sm text-[var(--muted-foreground)]">
        Missing payment link. Ask the merchant for a new link.
        <Link href="/" className="mt-6 block text-cyan-400 hover:underline">
          Back to store
        </Link>
      </div>
    );
  }

  let claims: PayLinkClaims;
  try {
    claims = await verifyPaymentLinkToken(raw);
  } catch {
    return (
      <div className="mx-auto max-w-md flex-1 px-4 py-20 text-center text-sm text-[var(--muted-foreground)]">
        This payment link is invalid or has expired.
        <Link href="/" className="mt-6 block text-cyan-400 hover:underline">
          Back to store
        </Link>
      </div>
    );
  }

  const amountLabel = formatMoaPrice(claims.amountAud);
  const stripe = getStripe();

  let clientSecret: string | null = null;
  let piError = "";
  if (pk && stripe) {
    try {
      const pi = await stripe.paymentIntents.create({
        amount: Math.round(claims.amountAud * 100),
        currency: "aud",
        automatic_payment_methods: { enabled: true },
        description: claims.title.slice(0, 200),
        metadata: {
          checkout_kind: "admin_link",
          admin_mode: claims.mode,
          ...(claims.productId ? { product_id: claims.productId } : {}),
          ...(claims.reference ? { payment_reference: claims.reference.slice(0, 40) } : {}),
        },
      });
      clientSecret = pi.client_secret ?? null;
      if (!clientSecret) piError = "Could not start payment.";
    } catch {
      piError =
        "Could not create payment. Ask the merchant to check Stripe credentials.";
    }
  }

  const canPayEmbedded = Boolean(pk && stripe && clientSecret);

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-14 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-400/80">
        Pay · Kuka Arthouse
      </p>
      <h1 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
        Payment summary
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Confirm the details below, then pay securely on this page — your card runs
        in embedded Stripe fields; we don&apos;t redirect you to Stripe-hosted
        checkout.
      </p>

      <div className="ai-panel mt-8 rounded-sm p-6 sm:p-8">
        <dl>
          <DetailRow label="Description / memo">{claims.title}</DetailRow>
          {claims.reference ? (
            <DetailRow label="Order / payment reference">
              <span className="font-mono tracking-tight">{claims.reference}</span>
            </DetailRow>
          ) : null}
          <DetailRow label="Amount due">
            <span className="text-lg font-semibold tabular-nums text-cyan-200/90">
              {amountLabel} AUD
            </span>
          </DetailRow>
        </dl>

        {!canPayEmbedded ? (
          <div className="mt-8 rounded-sm border border-dashed border-[var(--border)] bg-[var(--card-solid)]/30 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/95">
              Card payment unavailable
            </p>
            {!pk ? (
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                This site must set{" "}
                <code className="rounded bg-[var(--surface-elevated)] px-1 font-mono text-[11px] text-[var(--foreground)]">
                  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                </code>{" "}
                in production (Dashboard → Env). Without it Stripe.js cannot render
                the card form — the amount and memo above still match what you were
                sent to pay.
              </p>
            ) : !stripe ? (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                Server Stripe key is missing. Set{" "}
                <code className="rounded bg-[var(--surface-elevated)] px-1 font-mono text-[11px]">
                  STRIPE_SECRET_KEY
                </code>{" "}
                on the host.
              </p>
            ) : piError ? (
              <p className="mt-3 text-sm text-red-400/95">{piError}</p>
            ) : null}
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              Questions:{" "}
              <a
                href={`mailto:${STORE_SUPPORT_EMAIL}`}
                className="text-cyan-400/90 underline-offset-4 hover:underline"
              >
                {STORE_SUPPORT_EMAIL}
              </a>
            </p>

            {/* Read-only placeholders so layout looks like a checkout form */}
            <div className="mt-6 space-y-3 opacity-75">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Cardholder name
                </span>
                <div className="mt-1 h-11 rounded-sm border border-[var(--border)] bg-[var(--input-bg)]/50" />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Card number
                </span>
                <div className="mt-1 h-11 rounded-sm border border-[var(--border)] bg-[var(--input-bg)]/50" />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Card payment
            </p>
            <EmbeddedStripePayment
              publishableKey={pk}
              clientSecret={clientSecret!}
              amountLabel={amountLabel}
            />
          </div>
        )}
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
        Outside Australia — if shipping applies — email{" "}
        <a
          href={`mailto:${STORE_SUPPORT_EMAIL}`}
          className="text-cyan-400/90 underline-offset-4 hover:underline"
        >
          {STORE_SUPPORT_EMAIL}
        </a>{" "}
        for a freight quotation.
      </p>

      <div className="mt-10 space-y-4 text-center">
        <StorePolicyLinks tight />
      </div>

      <p className="mt-10 text-center">
        <Link
          href="/"
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-cyan-400"
        >
          ← Storefront
        </Link>
      </p>
    </div>
  );
}
