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
  const [step, setStep] = useState<"details" | "payment">("details");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shipLine1, setShipLine1] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipPostal, setShipPostal] = useState("");
  const [shipCountryLabel, setShipCountryLabel] = useState("Australia");

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billName, setBillName] = useState("");
  const [billLine1, setBillLine1] = useState("");
  const [billCity, setBillCity] = useState("");
  const [billPostal, setBillPostal] = useState("");
  const [billCountryLabel, setBillCountryLabel] = useState("Australia");

  function syncBillingFromShipping() {
    setBillName(name);
    setBillLine1(shipLine1);
    setBillCity(shipCity);
    setBillPostal(shipPostal);
    setBillCountryLabel(shipCountryLabel);
  }

  function toggleBillingSame(checked: boolean) {
    setBillingSameAsShipping(checked);
    if (!checked) syncBillingFromShipping();
  }

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const stripeBillingCountry =
    billingSameAsShipping ? shipCountryLabel : billCountryLabel;
  const stripeBillingLine1 =
    billingSameAsShipping ? shipLine1 : billLine1;
  const stripeBillingCity =
    billingSameAsShipping ? shipCity : billCity;
  const stripeBillingPostal =
    billingSameAsShipping ? shipPostal : billPostal;
  const stripeBillingName =
    billingSameAsShipping ? name : billName || name;

  const billingPrefill: StripeBillingPrefill | undefined =
    step === "payment" && email
      ? {
          email,
          name: stripeBillingName,
          phone: phone.trim() || undefined,
          address: {
            line1: stripeBillingLine1,
            city: stripeBillingCity,
            postal_code: stripeBillingPostal,
            country: countryLabelToIso(stripeBillingCountry),
          },
        }
      : undefined;

  async function startPayment() {
    setMsg("");
    if (!publishableKey) {
      setMsg("Payments are not configured (missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).");
      return;
    }

    if (!billingSameAsShipping) {
      if (
        (billName || "").trim().length < 2 ||
        (billLine1 || "").trim().length < 4 ||
        (billCity || "").trim().length < 2
      ) {
        setMsg("Please complete billing: name, street address, and city.");
        return;
      }
    }

    setBusy(true);
    try {
      const res = await fetch("/api/stripe/create-pay-link-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          shipping: {
            email,
            name,
            phone,
            line1: shipLine1,
            city: shipCity,
            postal_code: shipPostal,
            countryLabel: shipCountryLabel,
          },
          billing_same_as_shipping: billingSameAsShipping,
          ...(billingSameAsShipping
            ? {}
            : {
                billing_address: {
                  name: billName.trim(),
                  line1: billLine1.trim(),
                  city: billCity.trim(),
                  postal_code: billPostal.trim(),
                  countryLabel: billCountryLabel,
                },
              }),
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

  function handleSubmit(e: React.FormEvent) {
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

      {step === "details" ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Shipping information
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Where we should send order updates and deliver your artwork where applicable.
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
                Full name <span className="normal-case opacity-70">(recipient)</span>
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
              <label htmlFor="pl-ship-line1" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Shipping street address
              </label>
              <input
                id="pl-ship-line1"
                autoComplete="shipping address-line1"
                required
                value={shipLine1}
                onChange={(e) => setShipLine1(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="pl-ship-city" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                City
              </label>
              <input
                id="pl-ship-city"
                autoComplete="shipping address-level2"
                required
                value={shipCity}
                onChange={(e) => setShipCity(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="pl-ship-postal" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Postcode / ZIP
              </label>
              <input
                id="pl-ship-postal"
                autoComplete="shipping postal-code"
                value={shipPostal}
                onChange={(e) => setShipPostal(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pl-ship-country" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Country / region
              </label>
              <select
                id="pl-ship-country"
                autoComplete="shipping country"
                value={shipCountryLabel}
                onChange={(e) => setShipCountryLabel(e.target.value)}
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

          <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-[var(--border-dim)] bg-[var(--surface-elevated)]/35 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={billingSameAsShipping}
              onChange={(e) => toggleBillingSame(e.target.checked)}
              className="mt-1 shrink-0 rounded border-cyan-500/40 bg-[var(--input-bg)]"
            />
            <span>
              <span className="font-medium text-[var(--foreground)]">
                Billing address is the same as shipping address
              </span>
              <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                Your card issuer may verify the billing address you enter later on the secure card form if it differs.
              </span>
            </span>
          </label>

          {!billingSameAsShipping ? (
            <div className="rounded-sm border border-cyan-500/20 bg-[var(--surface-elevated)]/20 p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Billing information
              </p>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                Card billing / statement address — can differ from where we ship your order.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="pl-bill-name" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Full name <span className="normal-case opacity-70">(on card / account)</span>
                  </label>
                  <input
                    id="pl-bill-name"
                    autoComplete="billing name"
                    required={!billingSameAsShipping}
                    value={billName}
                    onChange={(e) => setBillName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="pl-bill-line1" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Billing street address
                  </label>
                  <input
                    id="pl-bill-line1"
                    autoComplete="billing address-line1"
                    required={!billingSameAsShipping}
                    value={billLine1}
                    onChange={(e) => setBillLine1(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="pl-bill-city" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    City
                  </label>
                  <input
                    id="pl-bill-city"
                    autoComplete="billing address-level2"
                    required={!billingSameAsShipping}
                    value={billCity}
                    onChange={(e) => setBillCity(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="pl-bill-postal" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Postcode / ZIP
                  </label>
                  <input
                    id="pl-bill-postal"
                    autoComplete="billing postal-code"
                    value={billPostal}
                    onChange={(e) => setBillPostal(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="pl-bill-country" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Country / region
                  </label>
                  <select
                    id="pl-bill-country"
                    autoComplete="billing country"
                    value={billCountryLabel}
                    onChange={(e) => setBillCountryLabel(e.target.value)}
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
            </div>
          ) : null}

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
              setStep("details");
              setClientSecret(null);
              setMsg("");
            }}
            className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 underline-offset-4 hover:text-cyan-400 hover:underline"
          >
            ← Edit shipping &amp; billing details
          </button>
        </div>
      ) : null}
    </div>
  );
}
