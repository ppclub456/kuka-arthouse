"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/context/cart-context";
import { formatMoaPrice } from "@/lib/format";
import { STORE_FLAT_SHIPPING_AUD } from "@/lib/pricing-store";

const COUNTRIES = [
  "Australia",
  "New Zealand",
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Japan",
  "China",
  "India",
  "Brazil",
  "Mexico",
  "Netherlands",
  "Italy",
  "Spain",
  "Other",
];

type TipChoice = "none" | "2" | "5" | "10" | "custom";

export function CheckoutForm() {
  const { lines, subtotalAud } = useCart();

  const [tipChoice, setTipChoice] = useState<TipChoice>("none");
  const [tipCustom, setTipCustom] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("Australia");

  const tipAmount = useMemo(() => {
    if (tipChoice === "none") return 0;
    if (tipChoice === "custom") {
      const n = Number.parseFloat(tipCustom);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    }
    return Number(tipChoice);
  }, [tipChoice, tipCustom]);

  const subtotalWithTip = subtotalAud + tipAmount;
  const shippingAmount = STORE_FLAT_SHIPPING_AUD;
  const orderTotal = subtotalWithTip + shippingAmount;

  const [payError, setPayError] = useState("");
  const [payPending, setPayPending] = useState(false);

  async function handleProceedToPayment() {
    setPayError("");
    setPayPending(true);
    try {
      const res = await fetch("/api/stripe/store-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
          tipAmountAud: tipAmount,
          customerEmail: email.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
      };
      if (!res.ok) {
        setPayError(data.error ?? "Could not start checkout. Try again shortly.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setPayError("Could not open the payment page. Please try again.");
    } catch {
      setPayError("Network error. Please try again.");
    } finally {
      setPayPending(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="ai-panel rounded-sm px-6 py-14 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">Your cart is empty.</p>
        <Link
          href="/"
          className="mt-5 inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)] underline-offset-4 hover:underline"
        >
          Return to store
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12 lg:items-start">
      <div className="order-2 space-y-10 lg:order-1">
        <p className="rounded-sm border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-3 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          You are checking out as a <strong className="text-[var(--foreground)]">guest</strong>
          . No account is required. Optional{" "}
          <Link
            href="/login"
            className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
          >
            customer login
          </Link>{" "}
          is only for returning visitors — there is no sign-up flow.
        </p>
        <section className="ai-panel rounded-sm p-6">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Leave a Tip
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Optional — Support our artists!
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                { key: "2" as const, label: "$2" },
                { key: "5" as const, label: "$5" },
                { key: "10" as const, label: "$10" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTipChoice(key)}
                className={`rounded-sm border px-4 py-2 text-sm font-medium transition ${
                  tipChoice === key
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] hover:border-cyan-400/35"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTipChoice("none")}
              className={`rounded-sm border px-4 py-2 text-sm font-medium transition ${
                tipChoice === "none"
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] hover:border-cyan-400/35"
              }`}
            >
              No Tip
            </button>
            <button
              type="button"
              onClick={() => setTipChoice("custom")}
              className={`rounded-sm border px-4 py-2 text-sm font-medium transition ${
                tipChoice === "custom"
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] hover:border-cyan-400/35"
              }`}
            >
              Custom
            </button>
          </div>
          {tipChoice === "custom" && (
            <label className="mt-4 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <span>Custom amount: $</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={tipCustom}
                onChange={(e) => setTipCustom(e.target.value)}
                className="w-28 border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1.5 text-[var(--foreground)]"
              />
            </label>
          )}
        </section>

        <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
          <section className="ai-panel rounded-sm p-6">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Personal Information
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="co-email"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  Email <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="co-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400/60"
                />
              </div>
              <div>
                <label
                  htmlFor="co-fn"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  First Name <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="co-fn"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400/60"
                />
              </div>
              <div>
                <label
                  htmlFor="co-ln"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  Last Name <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="co-ln"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400/60"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="co-phone"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  Phone Number <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400/60"
                />
              </div>
            </div>
          </section>

          <section className="ai-panel rounded-sm p-6">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Billing Address
            </h2>
            <div className="mt-6 grid gap-5">
              <div>
                <label
                  htmlFor="co-street"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  Street Address <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="co-street"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  autoComplete="street-address"
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400/60"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="co-city"
                    className="text-sm font-medium text-[var(--foreground)]"
                  >
                    City <span className="text-[var(--accent)]">*</span>
                  </label>
                  <input
                    id="co-city"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    autoComplete="address-level2"
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400/60"
                  />
                </div>
                <div>
                  <label
                    htmlFor="co-postal"
                    className="text-sm font-medium text-[var(--foreground)]"
                  >
                    Postal Code <span className="text-[var(--accent)]">*</span>
                  </label>
                  <input
                    id="co-postal"
                    required
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    autoComplete="postal-code"
                    className="mt-1.5 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400/60"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="co-country"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  Country <span className="text-[var(--accent)]">*</span>
                </label>
                <select
                  id="co-country"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  autoComplete="country-name"
                  className="mt-1.5 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400/60"
                >
                  {COUNTRIES.map((c) => (
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
              Payment
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              You&apos;ll complete payment on our secure checkout page. Your order summary includes
              a flat shipping fee for this order ({formatMoaPrice(STORE_FLAT_SHIPPING_AUD)}).
            </p>
          </section>

          {payError ? (
            <p className="text-center text-sm text-red-400/90" role="alert">
              {payError}
            </p>
          ) : null}

          <button
            type="button"
            disabled={payPending}
            onClick={() => void handleProceedToPayment()}
            className="moa-cta w-full py-4 text-center text-sm font-semibold uppercase tracking-[0.2em] shadow-md shadow-[var(--accent)]/20 disabled:opacity-60"
          >
            {payPending ? "Opening secure checkout…" : "Proceed to payment"}
          </button>
          <p className="text-center text-xs leading-relaxed text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">Secure payment:</span>{" "}
            Card details are entered on our payment provider&apos;s encrypted page — we never see your
            full card number.
          </p>
        </form>
      </div>

      <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
        <div className="ai-panel rounded-sm p-6 shadow-[0_0_40px_rgba(99,102,241,0.08)]">
          <h2 className="text-base font-semibold text-cyan-400/90">
            Order Summary
          </h2>
          <ul className="mt-6 space-y-6">
            {lines.map((line) => (
              <li key={line.productId} className="flex gap-4 border-b border-[var(--border)] pb-6 last:border-0 last:pb-0">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-[var(--background)]">
                  <Image
                    src={line.imageSrc}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {line.title}
                  </p>
                  <p className="mt-1 text-xs text-violet-400/90">
                    {line.categoryLabel ?? "Digital"}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Qty: {line.quantity}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                    {formatMoaPrice(line.priceAud * line.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 border-t border-[var(--border)] pt-6 text-sm">
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Subtotal</span>
              <span className="font-medium text-[var(--foreground)]">
                {formatMoaPrice(subtotalAud)}
              </span>
            </div>
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Tip Amount</span>
              <span className="font-medium text-[var(--foreground)]">
                {formatMoaPrice(tipAmount)}
              </span>
            </div>
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Shipping (flat rate, per order)</span>
              <span className="font-medium text-[var(--foreground)]">
                {formatMoaPrice(shippingAmount)}
              </span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-3 text-base font-semibold">
              <span className="text-[var(--foreground)]">Total</span>
              <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
                {formatMoaPrice(orderTotal)}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
