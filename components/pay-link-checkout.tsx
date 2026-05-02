"use client";

import type { StripeBillingPrefill } from "@/components/embedded-stripe-payment";
import { EmbeddedStripePayment } from "@/components/embedded-stripe-payment";
import { CHECKOUT_COUNTRY_LABELS } from "@/lib/checkout-countries";
import { countryLabelToIso } from "@/lib/country-iso";
import { useState } from "react";

export type PayLinkCheckoutProps = {
  code: string;
  title: string;
  reference?: string | null;
  amountLabel: string;
  /** Whether Stripe Elements can render (publishable key set in production). */
  publishableKey: string | null;
};

const inputCls =
  "mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-sky-500/50 focus:outline-none rounded-sm";

export function PayLinkCheckout({
  code,
  title,
  reference,
  amountLabel,
  publishableKey,
}: PayLinkCheckoutProps) {
  const [step, setStep] = useState<"billing" | "payment">("billing");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [countryLabel, setCountryLabel] = useState("Australia");

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const billingPrefill: StripeBillingPrefill | undefined =
    step === "payment" && email
      ? {
          email,
          name,
          phone: phone.trim() || undefined,
          address: {
            line1,
            city,
            postal_code: postal,
            country: countryLabelToIso(countryLabel),
          },
        }
      : undefined;

  async function startPayment() {
    setMsg("");
    if (!publishableKey) {
      setMsg("Payments are not configured (missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/create-pay-link-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          billing: {
            email,
            name,
            phone,
            line1,
            city,
            postal_code: postal,
            countryLabel,
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        clientSecret?: string;
      };
      if (!res.ok) {
        setMsg(data.error ?? "Could not prepare payment.");
        return;
      }
      if (!data.clientSecret) {
        setMsg("Stripe did not return a client secret.");
        return;
      }
      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch {
      setMsg("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleBillingSubmit(e: React.FormEvent) {
    e.preventDefault();
    void startPayment();
  }

  return (
    <div className="ai-panel mt-8 rounded-sm p-6 sm:p-8">
      <dl className="border-b border-[var(--border-dim)] pb-4">
        <div className="flex justify-between gap-4 py-2 text-sm">
          <dt className="text-[var(--muted-foreground)]">Description</dt>
          <dd className="max-w-[60%] text-right font-medium text-[var(--foreground)]">
            {title}
          </dd>
        </div>
        {reference ? (
          <div className="flex justify-between gap-4 py-2 text-sm">
            <dt className="text-[var(--muted-foreground)]">Reference</dt>
            <dd className="font-mono text-[var(--foreground)]">{reference}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4 py-2 text-base">
          <dt className="text-[var(--muted-foreground)]">Amount due</dt>
          <dd className="font-semibold tabular-nums text-cyan-200/90">{amountLabel} AUD</dd>
        </div>
      </dl>

      {step === "billing" ? (
        <form onSubmit={handleBillingSubmit} className="mt-6 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Billing information
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Enter the details matching your card or invoice. Same page embedded card payment — no Stripe
            Checkout redirect for standard cards.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="pl-email" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Email
              </label>
              <input
                id="pl-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pl-name" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Full name
              </label>
              <input
                id="pl-name"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pl-phone" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Phone <span className="normal-case opacity-70">(optional)</span>
              </label>
              <input
                id="pl-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pl-line1" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Street address
              </label>
              <input
                id="pl-line1"
                autoComplete="address-line1"
                required
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="pl-city" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                City
              </label>
              <input
                id="pl-city"
                autoComplete="address-level2"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="pl-postal" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Postcode / ZIP
              </label>
              <input
                id="pl-postal"
                autoComplete="postal-code"
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pl-country" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Country / region
              </label>
              <select
                id="pl-country"
                value={countryLabel}
                onChange={(e) => setCountryLabel(e.target.value)}
                className={inputCls}
              >
                {CHECKOUT_COUNTRY_LABELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {msg ? (
            <p className="text-sm text-red-400/95" role="alert">
              {msg}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="moa-cta w-full py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] disabled:opacity-50"
          >
            {busy ? "Preparing secure payment…" : "Continue to card payment"}
          </button>
        </form>
      ) : publishableKey && clientSecret ? (
        <div className="mt-8">
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Card details · amount {amountLabel} AUD · link code{" "}
            <span className="font-mono text-cyan-200/85">{code}</span>
          </p>
          <div className="mt-6">
            <EmbeddedStripePayment
              key={clientSecret}
              publishableKey={publishableKey}
              clientSecret={clientSecret}
              amountLabel={amountLabel}
              defaultBillingDetails={billingPrefill}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setStep("billing");
              setClientSecret(null);
              setMsg("");
            }}
            className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 underline-offset-4 hover:text-cyan-400 hover:underline"
          >
            ← Edit billing details
          </button>
        </div>
      ) : null}
    </div>
  );
}
