"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMemo, useState } from "react";

export type StripeBillingPrefill = {
  email?: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    city?: string;
    country?: string;
    postal_code?: string;
  };
};

export function EmbeddedStripePayment({
  publishableKey,
  clientSecret,
  amountLabel,
  defaultBillingDetails,
}: {
  publishableKey: string;
  clientSecret: string;
  amountLabel: string;
  defaultBillingDetails?: StripeBillingPrefill;
}) {
  const stripePromise = useMemo(
    () => loadStripe(publishableKey),
    [publishableKey],
  );

  const options = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: "night" as const,
        variables: {
          colorPrimary: "#22d3ee",
          colorBackground: "#0f172a",
          colorText: "#e2e8f0",
          borderRadius: "4px",
        },
      },
      ...(defaultBillingDetails
        ? { defaultValues: { billingDetails: defaultBillingDetails } }
        : {}),
    }),
    [clientSecret, defaultBillingDetails],
  );

  return (
    <Elements stripe={stripePromise} options={options}>
      <PayForm amountLabel={amountLabel} />
    </Elements>
  );
}

function PayForm({ amountLabel }: { amountLabel: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setMsg("");
    setBusy(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success?payment_intent={PAYMENT_INTENT_ID}`,
      },
      redirect: "if_required",
    });
    setBusy(false);
    if (error) {
      setMsg(error.message ?? "Payment could not be completed.");
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      window.location.href = `/success?payment_intent=${paymentIntent.id}`;
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <PaymentElement options={{ layout: "tabs" }} />
      {msg ? (
        <p className="text-sm text-red-400/90" role="alert">
          {msg}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!stripe || busy}
        className="moa-cta w-full py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] disabled:opacity-50"
      >
        {busy ? "Processing…" : `Pay ${amountLabel}`}
      </button>
    </form>
  );
}
