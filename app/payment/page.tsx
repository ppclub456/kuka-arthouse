import Link from "next/link";
import { PaymentPageForm } from "@/components/payment-page-form";
import { StorePolicyLinks } from "@/components/store-policy-links";
import { STORE_SUPPORT_EMAIL } from "@/lib/store-contact";

export default function PaymentPage() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        Make a payment
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Enter your order number and payment in NZD — we convert to AUD using Google Finance, then
        you pay by card in Australian dollars. Add shipping and billing details below.
      </p>

      {!publishableKey ? (
        <p className="mt-10 rounded-sm border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Card payments are not configured on this site yet. Please contact{" "}
          <a href={`mailto:${STORE_SUPPORT_EMAIL}`} className="underline">
            {STORE_SUPPORT_EMAIL}
          </a>
          .
        </p>
      ) : (
        <div className="mt-10">
          <PaymentPageForm publishableKey={publishableKey} />
        </div>
      )}

      <footer className="mt-14 space-y-4 border-t border-[var(--border-dim)] pt-10 pb-8 text-center">
        <p className="mx-auto max-w-xl text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          By paying you agree to our{" "}
          <Link href="/terms" className="text-cyan-400/85 underline-offset-2 hover:underline">
            Terms of Service
          </Link>
          ,{" "}
          <Link href="/refunds" className="text-cyan-400/85 underline-offset-2 hover:underline">
            Refunds policy
          </Link>
          , and{" "}
          <Link href="/shipping" className="text-cyan-400/85 underline-offset-2 hover:underline">
            Shipping policy
          </Link>
          .
        </p>
        <StorePolicyLinks tight />
      </footer>
    </div>
  );
}
