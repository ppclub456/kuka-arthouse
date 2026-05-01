import Link from "next/link";
import { StripeSuccessClearCart } from "@/components/stripe-success-clear-cart";
import { getStripe } from "@/lib/stripe-server";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function SuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const sessionId = sp.session_id;

  let headline = "Thank you";
  let detail =
    "If you completed Stripe Checkout, your payment is processed by Stripe. Check your email for confirmation in live mode.";

  if (sessionId) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const s = await stripe.checkout.sessions.retrieve(sessionId);
        if (s.payment_status === "paid") {
          headline = "Payment successful";
          detail = `Checkout session is paid. Reference: ${s.id}`;
        } else if (s.payment_status === "unpaid") {
          headline = "Payment not completed";
          detail =
            "This session was not paid. You can close this tab or return to the shop.";
        }
      } catch {
        detail =
          "We could not verify this session. Check STRIPE_SECRET_KEY or the link you used.";
      }
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <StripeSuccessClearCart sessionId={sessionId} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-400/80">
        Confirmed
      </p>
      <h1 className="mt-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
        {headline}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
        {detail}
      </p>
      <Link
        href="/"
        className="moa-cta-outline mt-10 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
      >
        Back to shop
      </Link>
    </div>
  );
}
