import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
import { StorePolicyLinks } from "@/components/store-policy-links";
import { STORE_SUPPORT_EMAIL } from "@/lib/store-contact";

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
        Checkout
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Guest checkout — no account required. Review your order, add an optional
        tip, then continue to payment. Card details are handled by Stripe inside
        this site.
      </p>
      <div className="mt-10">
        <CheckoutForm />
      </div>

      <footer className="mt-14 space-y-4 border-t border-[var(--border-dim)] pt-10 pb-8 text-center">
        <p className="mx-auto max-w-xl text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          By proceeding to payment you agree to our{" "}
          <Link href="/terms" className="text-cyan-400/85 underline-offset-2 hover:text-cyan-300 hover:underline">
            Terms of Service
          </Link>
          ,{" "}
          <Link href="/refunds" className="text-cyan-400/85 underline-offset-2 hover:text-cyan-300 hover:underline">
            Refunds policy
          </Link>
          , and{" "}
          <Link href="/shipping" className="text-cyan-400/85 underline-offset-2 hover:text-cyan-300 hover:underline">
            Shipping policy
          </Link>
          . See also our{" "}
          <Link href="/privacy" className="text-cyan-400/85 underline-offset-2 hover:text-cyan-300 hover:underline">
            Privacy policy
          </Link>{" "}
          for how checkout data is used.
        </p>
        <StorePolicyLinks tight />
        <p className="text-[10px] text-slate-500">
          Support:{" "}
          <a
            href={`mailto:${STORE_SUPPORT_EMAIL}`}
            className="text-cyan-400/85 underline-offset-2 hover:text-cyan-300 hover:underline"
          >
            {STORE_SUPPORT_EMAIL}
          </a>
        </p>
      </footer>
    </div>
  );
}
