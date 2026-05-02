import Link from "next/link";
import { StripeSuccessClearCart } from "@/components/stripe-success-clear-cart";
import { getStripe } from "@/lib/stripe-server";
import { STORE_SUPPORT_EMAIL } from "@/lib/store-contact";

type Props = {
  searchParams: Promise<{
    session_id?: string;
    payment_intent?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const sessionId = sp.session_id;
  const paymentIntentId = sp.payment_intent;

  let headline = "Thank you";
  let detail =
    "If your payment completed, look for an email confirmation from us when fulfilment begins.";

  const stripe = getStripe();

  if (stripe && paymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.status === "succeeded") {
        headline = "Payment successful";
        detail = `Thank you — we received your payment. Reference: ${pi.id}`;
      } else if (pi.status === "requires_payment_method") {
        headline = "Payment not completed";
        detail =
          "This payment was not finished. Return to checkout and try again, or choose another payment method.";
      }
    } catch {
      detail =
        `We could not verify this payment. If your card was charged, keep your receipt and contact ${STORE_SUPPORT_EMAIL}.`;
    }
  } else if (stripe && sessionId) {
    try {
      const s = await stripe.checkout.sessions.retrieve(sessionId);
      if (s.payment_status === "paid") {
        headline = "Payment successful";
        detail = `Payment received. Reference: ${s.id}`;
      } else if (s.payment_status === "unpaid") {
        headline = "Payment not completed";
        detail =
          "This session was not paid. You can close this tab or return to the shop.";
      }
    } catch {
      detail = `We could not verify this payment session. If you were charged, save your receipt and contact ${STORE_SUPPORT_EMAIL}.`;
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <StripeSuccessClearCart
        sessionId={sessionId}
        paymentIntentId={paymentIntentId}
      />
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
