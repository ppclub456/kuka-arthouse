"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { convertNzdToAud } from "@/lib/fx/nzd-aud";
import type { StripeBillingPrefill } from "@/components/embedded-stripe-payment";
import { EmbeddedStripePayment } from "@/components/embedded-stripe-payment";
import { CHECKOUT_COUNTRY_LABELS } from "@/lib/checkout-countries";
import { PRODUCTS } from "@/data/products";
import { countryLabelToIso } from "@/lib/country-iso";
import { formatMoaPrice } from "@/lib/format";

const inputCls =
  "mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-cyan-400/60 focus:outline-none rounded-sm";

type Props = {
  publishableKey: string;
};

export function PaymentPageForm({ publishableKey }: Props) {
  const [productId, setProductId] = useState(PRODUCTS[0]?.id ?? "");
  const [orderNumber, setOrderNumber] = useState("");
  const [nzdInput, setNzdInput] = useState("");
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [fxDate, setFxDate] = useState<string | null>(null);
  const [fxError, setFxError] = useState("");
  const [fxLoading, setFxLoading] = useState(true);

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

  const [step, setStep] = useState<"details" | "payment">("details");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [totalAud, setTotalAud] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const selected = PRODUCTS.find((p) => p.id === productId);

  useEffect(() => {
    let cancelled = false;

    async function loadRate() {
      setFxLoading(true);
      setFxError("");
      try {
        const res = await fetch("/api/fx/nzd-aud");
        const data = (await res.json().catch(() => ({}))) as {
          rate?: number;
          date?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || typeof data.rate !== "number") {
          setFxRate(null);
          setFxDate(null);
          setFxError(data.error ?? "Could not load today’s exchange rate.");
          return;
        }
        setFxRate(data.rate);
        setFxDate(typeof data.date === "string" ? data.date : null);
      } catch {
        if (!cancelled) {
          setFxRate(null);
          setFxDate(null);
          setFxError("Network error — try again.");
        }
      } finally {
        if (!cancelled) setFxLoading(false);
      }
    }

    void loadRate();
    return () => {
      cancelled = true;
    };
  }, []);

  const amountNzd = useMemo(() => {
    const n = Number.parseFloat(nzdInput.trim().replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [nzdInput]);

  const amountAud = useMemo(() => {
    if (amountNzd == null || fxRate == null) return null;
    return convertNzdToAud(amountNzd, fxRate);
  }, [amountNzd, fxRate]);

  const previewTotalAud = amountAud;

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

  const stripeBillingCountry =
    billingSameAsShipping ? shipCountryLabel : billCountryLabel;
  const stripeBillingLine1 =
    billingSameAsShipping ? shipLine1 : billLine1;
  const stripeBillingCity = billingSameAsShipping ? shipCity : billCity;
  const stripeBillingPostal =
    billingSameAsShipping ? shipPostal : billPostal;
  const stripeBillingName = billingSameAsShipping ? name : billName || name;

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

  const amountLabel =
    totalAud != null
      ? formatMoaPrice(totalAud)
      : previewTotalAud != null
        ? formatMoaPrice(previewTotalAud)
        : "—";

  function formatNzd(amount: number): string {
    return new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency: "NZD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  async function startPayment() {
    setMsg("");
    if (!publishableKey) {
      setMsg("Payments are not configured (missing Stripe publishable key).");
      return;
    }
    if (!productId) {
      setMsg("Please select a product.");
      return;
    }
    if (!orderNumber.trim()) {
      setMsg("Please enter your order number.");
      return;
    }
    if (amountNzd == null) {
      setMsg("Please enter your payment amount in NZD.");
      return;
    }
    if (fxRate == null) {
      setMsg(fxError || "Exchange rate is not available. Please try again shortly.");
      return;
    }
    if (amountAud == null || amountAud < 0.5) {
      setMsg("Converted amount must be at least A$0.50 to pay by card.");
      return;
    }
    if (
      !email.trim().includes("@") ||
      name.trim().length < 2 ||
      shipLine1.trim().length < 4 ||
      shipCity.trim().length < 2
    ) {
      setMsg("Please complete shipping: email, recipient name, street address, and city.");
      return;
    }
    if (!billingSameAsShipping) {
      if (
        billName.trim().length < 2 ||
        billLine1.trim().length < 4 ||
        billCity.trim().length < 2
      ) {
        setMsg("Please complete billing: name, street address, and city.");
        return;
      }
    }

    setBusy(true);
    try {
      const res = await fetch("/api/stripe/create-payment-page-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          orderNumber: orderNumber.trim(),
          amountNzd,
          shipping: {
            email: email.trim(),
            name: name.trim(),
            phone: phone.trim(),
            line1: shipLine1.trim(),
            city: shipCity.trim(),
            postal_code: shipPostal.trim(),
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
        publishableKey?: string;
        totalAud?: number;
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
      setTotalAud(
        typeof data.totalAud === "number" && Number.isFinite(data.totalAud)
          ? data.totalAud
          : previewTotalAud,
      );
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

  if (!PRODUCTS.length) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        No products are available for payment.
      </p>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="space-y-8">
        {step === "details" ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="ai-panel rounded-sm p-6">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Product &amp; amount
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Select the artwork you are paying for, enter your order number, then the amount in
                NZD — we convert to AUD at today&apos;s Google Finance rate for card checkout.
              </p>

              <div className="mt-6">
                <label
                  htmlFor="pay-product"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  Product <span className="text-[var(--accent)]">*</span>
                </label>
                <select
                  id="pay-product"
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className={inputCls}
                >
                  {PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — list {formatMoaPrice(p.priceAud)}
                    </option>
                  ))}
                </select>
              </div>

              {selected ? (
                <div className="mt-4 flex gap-4 rounded-sm border border-[var(--border)] bg-[var(--surface-elevated)]/40 p-3">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-[var(--background)]">
                    <Image
                      src={selected.imageSrc}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-[var(--foreground)]">{selected.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Catalogue price {formatMoaPrice(selected.priceAud)} — your payment amount
                      may differ.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-6">
                <label
                  htmlFor="pay-order-no"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  Order number <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="pay-order-no"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. #PT-1234"
                  autoComplete="off"
                  className={inputCls}
                />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pay-amount-nzd"
                    className="text-sm font-medium text-[var(--foreground)]"
                  >
                    Payment amount (NZD) <span className="text-[var(--accent)]">*</span>
                  </label>
                  <input
                    id="pay-amount-nzd"
                    inputMode="decimal"
                    required
                    min={0.01}
                    step="0.01"
                    placeholder="0.00"
                    value={nzdInput}
                    onChange={(e) => setNzdInput(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label
                    htmlFor="pay-amount-aud"
                    className="text-sm font-medium text-[var(--foreground)]"
                  >
                    You pay (AUD)
                  </label>
                  <output
                    id="pay-amount-aud"
                    htmlFor="pay-amount-nzd"
                    className={`${inputCls} block tabular-nums font-semibold text-sky-900`}
                  >
                    {amountAud != null
                      ? formatMoaPrice(amountAud)
                      : nzdInput.trim()
                        ? "—"
                        : formatMoaPrice(0)}
                  </output>
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                {fxLoading ? (
                  "Loading Google Finance rate…"
                ) : fxRate != null ? (
                  <>
                    Google Finance: 1 NZD ={" "}
                    <span className="font-mono font-medium">{fxRate.toFixed(4)}</span> AUD
                    {fxDate ? (
                      <>
                        {" "}
                        · <span className="font-mono">{fxDate}</span>
                      </>
                    ) : null}
                    {amountNzd != null && amountAud != null ? (
                      <>
                        {" "}
                        · {formatNzd(amountNzd)} ≈{" "}
                        <span className="font-medium text-sky-900">
                          {formatMoaPrice(amountAud)}
                        </span>{" "}
                        charged at checkout
                      </>
                    ) : null}
                  </>
                ) : null}
              </p>
              {fxError ? (
                <p className="mt-1 text-xs font-medium text-red-400/95" role="alert">
                  {fxError}
                </p>
              ) : null}
              <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                Card checkout is in Australian dollars (AUD). Minimum charge A$0.50 after conversion.
                No shipping fee is added on this page.
              </p>
            </section>

            <section className="ai-panel rounded-sm p-6">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Shipping address
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Where we should send your order and payment confirmation.
              </p>

              <div className="mt-4 rounded-sm border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm leading-relaxed text-zinc-700">
                <p className="font-medium text-zinc-900">Where we ship from</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-600">
                  <li>
                    <strong className="font-medium text-zinc-800">New Zealand</strong> delivery
                    address — we ship from New Zealand.
                  </li>
                  <li>
                    <strong className="font-medium text-zinc-800">Australia</strong> delivery
                    address — we ship from Australia.
                  </li>
                  <li>
                    <strong className="font-medium text-zinc-800">United Kingdom</strong> delivery
                    address — we ship from the UK.
                  </li>
                </ul>
                <p className="mt-3 text-zinc-600">
                  Card payment on this page is always in{" "}
                  <strong className="font-medium text-zinc-800">Australian dollars (AUD)</strong> —
                  regardless of where your order is delivered.
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="pay-email" className="text-sm font-medium text-[var(--foreground)]">
                    Email <span className="text-[var(--accent)]">*</span>
                  </label>
                  <input
                    id="pay-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="pay-name" className="text-sm font-medium text-[var(--foreground)]">
                    Full name <span className="text-[var(--accent)]">*</span>
                  </label>
                  <input
                    id="pay-name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="pay-phone" className="text-sm font-medium text-[var(--foreground)]">
                    Phone
                  </label>
                  <input
                    id="pay-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="pay-ship-line1" className="text-sm font-medium text-[var(--foreground)]">
                    Street address <span className="text-[var(--accent)]">*</span>
                  </label>
                  <input
                    id="pay-ship-line1"
                    autoComplete="shipping address-line1"
                    required
                    value={shipLine1}
                    onChange={(e) => setShipLine1(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="pay-ship-city" className="text-sm font-medium text-[var(--foreground)]">
                    City <span className="text-[var(--accent)]">*</span>
                  </label>
                  <input
                    id="pay-ship-city"
                    autoComplete="shipping address-level2"
                    required
                    value={shipCity}
                    onChange={(e) => setShipCity(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="pay-ship-postal" className="text-sm font-medium text-[var(--foreground)]">
                    Postcode / ZIP
                  </label>
                  <input
                    id="pay-ship-postal"
                    autoComplete="shipping postal-code"
                    value={shipPostal}
                    onChange={(e) => setShipPostal(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="pay-ship-country" className="text-sm font-medium text-[var(--foreground)]">
                    Country / region <span className="text-[var(--accent)]">*</span>
                  </label>
                  <select
                    id="pay-ship-country"
                    autoComplete="shipping country"
                    required
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
            </section>

            <section className="ai-panel rounded-sm p-6">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Billing address
              </h2>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-sm border border-[var(--border-dim)] bg-[var(--surface-elevated)]/35 px-4 py-3 text-sm">
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
                    Uncheck if your card billing address is different from where we ship.
                  </span>
                </span>
              </label>

              {!billingSameAsShipping ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="pay-bill-name" className="text-sm font-medium text-[var(--foreground)]">
                      Full name (on card) <span className="text-[var(--accent)]">*</span>
                    </label>
                    <input
                      id="pay-bill-name"
                      autoComplete="billing name"
                      required={!billingSameAsShipping}
                      value={billName}
                      onChange={(e) => setBillName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="pay-bill-line1" className="text-sm font-medium text-[var(--foreground)]">
                      Billing street <span className="text-[var(--accent)]">*</span>
                    </label>
                    <input
                      id="pay-bill-line1"
                      autoComplete="billing address-line1"
                      required={!billingSameAsShipping}
                      value={billLine1}
                      onChange={(e) => setBillLine1(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="pay-bill-city" className="text-sm font-medium text-[var(--foreground)]">
                      City <span className="text-[var(--accent)]">*</span>
                    </label>
                    <input
                      id="pay-bill-city"
                      autoComplete="billing address-level2"
                      required={!billingSameAsShipping}
                      value={billCity}
                      onChange={(e) => setBillCity(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="pay-bill-postal" className="text-sm font-medium text-[var(--foreground)]">
                      Postcode / ZIP
                    </label>
                    <input
                      id="pay-bill-postal"
                      autoComplete="billing postal-code"
                      value={billPostal}
                      onChange={(e) => setBillPostal(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="pay-bill-country" className="text-sm font-medium text-[var(--foreground)]">
                      Country / region
                    </label>
                    <select
                      id="pay-bill-country"
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
              ) : null}
            </section>

            {msg ? (
              <p className="text-sm text-red-400/95" role="alert">
                {msg}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy || fxLoading || fxRate == null}
              className="moa-cta w-full py-4 text-sm font-semibold uppercase tracking-[0.2em] disabled:opacity-60"
            >
              {busy ? "Preparing secure payment…" : "Continue to card payment"}
            </button>
            <p className="text-center text-xs text-[var(--muted-foreground)]">
              Card details are encrypted by Stripe — we never see your full card number.
            </p>
          </form>
        ) : clientSecret ? (
          <div className="ai-panel rounded-sm p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-500/70">
              Card payment
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Pay {amountLabel} AUD for {selected?.title ?? "your order"}.
            </p>
            <div className="mt-6">
              <EmbeddedStripePayment
                key={clientSecret}
                publishableKey={publishableKey}
                clientSecret={clientSecret}
                amountLabel={amountLabel}
                defaultBillingDetails={billingPrefill}
                appearanceTheme="stripe"
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
              ← Edit details
            </button>
          </div>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="ai-panel rounded-sm p-6">
          <h2 className="text-base font-semibold text-zinc-900">Payment summary</h2>
          {selected ? (
            <div className="mt-4 flex gap-3 border-b border-[var(--border)] pb-4">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden">
                <Image
                  src={selected.imageSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <p className="text-sm font-medium leading-snug text-[var(--foreground)]">
                {selected.title}
              </p>
            </div>
          ) : null}
          {orderNumber.trim() ? (
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              Order no.{" "}
              <span className="font-mono font-medium text-[var(--foreground)]">
                {orderNumber.trim()}
              </span>
            </p>
          ) : null}
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <dt>Amount (NZD)</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {amountNzd != null ? formatNzd(amountNzd) : "—"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-3 text-base font-semibold">
              <dt className="text-[var(--foreground)]">You pay (AUD)</dt>
              <dd className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
                {previewTotalAud != null ? formatMoaPrice(previewTotalAud) : "—"}
              </dd>
            </div>
          </dl>
          <Link
            href="/"
            className="mt-6 inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)] hover:text-cyan-400"
          >
            ← Back to store
          </Link>
        </div>
      </aside>
    </div>
  );
}
