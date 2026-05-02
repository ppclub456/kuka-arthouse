import Link from "next/link";
import { EmbeddedStripePayment } from "@/components/embedded-stripe-payment";
import { StorePolicyLinks } from "@/components/store-policy-links";
import { formatMoaPrice } from "@/lib/format";
import { verifyPayLinkJWT } from "@/lib/payment-link-jwt";
import { getStripe } from "@/lib/stripe-server";
import { STORE_SUPPORT_EMAIL } from "@/lib/store-contact";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function PayLinkPage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = sp.token;

  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();

  if (!token?.trim()) {
    return (
      <div className="mx-auto max-w-md flex-1 px-4 py-20 text-center text-sm text-[var(--muted-foreground)]">
        Missing payment link. Ask the merchant for a new link.
        <Link href="/" className="mt-6 block text-cyan-400 hover:underline">
          Back to store
        </Link>
      </div>
    );
  }

  let claims;
  try {
    claims = await verifyPayLinkJWT(token.trim());
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

  if (!pk) {
    return (
      <div className="mx-auto max-w-md flex-1 px-4 py-20 text-center text-sm text-red-400/90">
        Payments are not configured on this site.
      </div>
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return (
      <div className="mx-auto max-w-md flex-1 px-4 py-20 text-center text-sm text-red-400/90">
        Checkout is temporarily unavailable.
      </div>
    );
  }

  const pi = await stripe.paymentIntents.create({
    amount: Math.round(claims.amountAud * 100),
    currency: "aud",
    automatic_payment_methods: { enabled: true },
    description: claims.title.slice(0, 200),
    metadata: {
      checkout_kind: "admin_link",
      admin_mode: claims.mode,
      ...(claims.productId ? { product_id: claims.productId } : {}),
    },
  });

  if (!pi.client_secret) {
    return (
      <div className="mx-auto max-w-md flex-1 px-4 py-20 text-center text-sm text-red-400/90">
        Could not create payment. Please ask for a new link.
      </div>
    );
  }

  const amountLabel = formatMoaPrice(claims.amountAud);

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-14 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-400/80">
        Pay · Kuka Arthouse
      </p>
      <h1 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
        {claims.title}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Total due:{" "}
        <span className="font-semibold text-cyan-200/90">{amountLabel} AUD</span>
      </p>
      <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
        Complete payment below on this page (embedded Stripe; we do not send you off to Stripe
        Checkout hosted pages). Outside Australia — if your order ships physically — email{" "}
        <a
          href={`mailto:${STORE_SUPPORT_EMAIL}`}
          className="text-cyan-400/90 underline-offset-4 hover:underline"
        >
          {STORE_SUPPORT_EMAIL}
        </a>{" "}
        for a freight quotation.
      </p>

      <div className="ai-panel mt-10 rounded-sm p-6 sm:p-8">
        <EmbeddedStripePayment
          publishableKey={pk}
          clientSecret={pi.client_secret}
          amountLabel={amountLabel}
        />
      </div>

      <div className="mt-12 space-y-4 text-center">
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
