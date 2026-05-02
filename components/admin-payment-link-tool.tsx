"use client";

import { useMemo, useState } from "react";
import { PRODUCTS } from "@/data/products";

/** invoice = single total AUD (order); catalog / custom = existing flows */
type Mode = "invoice" | "catalog" | "custom";

export function AdminPaymentLinkTool() {
  const [mode, setMode] = useState<Mode>("invoice");
  const [invoiceTitle, setInvoiceTitle] = useState("");
  const [invoiceTotal, setInvoiceTotal] = useState("");
  const [productId, setProductId] = useState(PRODUCTS[0]?.id ?? "");
  const [customTitle, setCustomTitle] = useState("");
  const [catalogOverride, setCatalogOverride] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [usePriceOverride, setUsePriceOverride] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [payPageUrl, setPayPageUrl] = useState("");
  const [genError, setGenError] = useState("");
  const [genPending, setGenPending] = useState(false);

  const selected = PRODUCTS.find((p) => p.id === productId);

  const qtyParsed = Number.parseInt(quantity, 10);
  const qtySafe =
    Number.isFinite(qtyParsed) && qtyParsed > 0 ? qtyParsed : 1;

  const resolvedUnitAud = useMemo(() => {
    if (mode === "invoice") {
      const n = Number.parseFloat(invoiceTotal.trim() || "0");
      return Number.isFinite(n) ? n : 0;
    }
    if (mode === "custom") {
      const n = Number.parseFloat(customAmount.trim() || "0");
      return Number.isFinite(n) ? n : 0;
    }
    if (!selected) return 0;
    if (usePriceOverride) {
      const n = Number.parseFloat(catalogOverride.trim() || "0");
      return Number.isFinite(n) ? n : selected.priceAud;
    }
    return selected.priceAud;
  }, [
    mode,
    selected,
    usePriceOverride,
    catalogOverride,
    customAmount,
    invoiceTotal,
  ]);

  const effectiveQty = mode === "invoice" ? 1 : qtySafe;

  const displayTitle =
    mode === "invoice"
      ? invoiceTitle.trim() || "Payment order"
      : mode === "custom"
        ? customTitle.trim() || "Custom payment"
        : selected?.title ?? "Item";

  const lineTotal = resolvedUnitAud * effectiveQty;

  async function handleGenerate() {
    setGenError("");
    setGenPending(true);
    setPayPageUrl("");

    try {
      const invoiceTotalAud = Number.parseFloat(invoiceTotal.trim() || "0");
      const res = await fetch("/api/stripe/issue-payment-link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mode,
          invoiceTitle: invoiceTitle.trim(),
          invoiceTotalAud,
          productId,
          usePriceOverride,
          catalogOverrideAud: Number.parseFloat(catalogOverride.trim() || "0"),
          customTitle: customTitle.trim(),
          customUnitAud: Number.parseFloat(customAmount.trim() || "0"),
          quantity: qtySafe,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
      };

      if (!res.ok) {
        setGenError(data.error ?? "Could not issue payment link.");
        return;
      }

      if (!data.url) {
        setGenError("Server did not return a URL.");
        return;
      }

      setPayPageUrl(data.url);
    } catch {
      setGenError("Network error — try again.");
    } finally {
      setGenPending(false);
    }
  }

  const input =
    "mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-cyan-400/50 focus:outline-none";

  return (
    <div className="ai-panel rounded-sm p-6 sm:p-8">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-800">
        Payment link · orders
      </h2>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Creates an on-site payment link: the customer completes card payment in our embedded form on{" "}
        <code className="rounded bg-[var(--surface-elevated)] px-1 font-mono text-[10px]">/pay</code>.
        Restricted to signed-in admins. Server needs{" "}
        <code className="rounded bg-[var(--surface-elevated)] px-1 font-mono text-[10px]">
          STRIPE_SECRET_KEY
        </code>{" "}
        and{" "}
        <code className="rounded bg-[var(--surface-elevated)] px-1 font-mono text-[10px]">
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        </code>
        .
      </p>

      <fieldset className="mt-8 space-y-3">
        <legend className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
          Source
        </legend>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground)]">
            <input
              type="radio"
              name="pay-mode"
              checked={mode === "invoice"}
              onChange={() => setMode("invoice")}
              className="border-cyan-500/40 bg-[var(--input-bg)]"
            />
            Invoice total (any amount)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground)]">
            <input
              type="radio"
              name="pay-mode"
              checked={mode === "catalog"}
              onChange={() => setMode("catalog")}
              className="border-cyan-500/40 bg-[var(--input-bg)]"
            />
            Catalog product
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground)]">
            <input
              type="radio"
              name="pay-mode"
              checked={mode === "custom"}
              onChange={() => setMode("custom")}
              className="border-cyan-500/40 bg-[var(--input-bg)]"
            />
            Custom unit × qty
          </label>
        </div>
      </fieldset>

      <div className="mt-8 space-y-5">
        {mode === "invoice" ? (
          <>
            <div>
              <label
                htmlFor="inv-title"
                className="text-[11px] uppercase tracking-wider text-zinc-600"
              >
                Customer-facing title / memo
              </label>
              <input
                id="inv-title"
                value={invoiceTitle}
                onChange={(e) => setInvoiceTitle(e.target.value)}
                className={input}
                placeholder="e.g. Order #4821 · Custom print balance"
              />
            </div>
            <div>
              <label
                htmlFor="inv-total"
                className="text-[11px] uppercase tracking-wider text-zinc-600"
              >
                Total due (AUD) — one payment
              </label>
              <input
                id="inv-total"
                inputMode="decimal"
                value={invoiceTotal}
                onChange={(e) => setInvoiceTotal(e.target.value)}
                className={input}
                placeholder="0.00"
              />
              <p className="mt-1.5 text-[11px] text-zinc-600">
                Quantity is 1 for this invoice. The customer pays the total on-site.
              </p>
            </div>
          </>
        ) : mode === "catalog" ? (
          <>
            <div>
              <label
                htmlFor="product-pick"
                className="text-[11px] uppercase tracking-wider text-zinc-600"
              >
                Product
              </label>
              <select
                id="product-pick"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)]"
              >
                {PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.priceAud.toFixed(2)} AUD
                  </option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <input
                type="checkbox"
                checked={usePriceOverride}
                onChange={(e) => setUsePriceOverride(e.target.checked)}
                className="rounded border-cyan-500/40 bg-[var(--input-bg)]"
              />
              Override unit price (AUD)
            </label>
            {usePriceOverride ? (
              <div>
                <label
                  htmlFor="price-ov"
                  className="text-[11px] uppercase tracking-wider text-zinc-600"
                >
                  Custom unit price (AUD)
                </label>
                <input
                  id="price-ov"
                  inputMode="decimal"
                  value={catalogOverride}
                  onChange={(e) => setCatalogOverride(e.target.value)}
                  className={input}
                  placeholder={selected ? String(selected.priceAud) : "0.00"}
                />
              </div>
            ) : null}
            <div>
              <label
                htmlFor="qty-pay"
                className="text-[11px] uppercase tracking-wider text-zinc-600"
              >
                Quantity
              </label>
              <input
                id="qty-pay"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={input}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label
                htmlFor="custom-title"
                className="text-[11px] uppercase tracking-wider text-zinc-600"
              >
                Description / title
              </label>
              <input
                id="custom-title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className={input}
                placeholder="e.g. Rush fee, Commission"
              />
            </div>
            <div>
              <label
                htmlFor="custom-amt"
                className="text-[11px] uppercase tracking-wider text-zinc-600"
              >
                Unit price (AUD)
              </label>
              <input
                id="custom-amt"
                inputMode="decimal"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className={input}
                placeholder="0.00"
              />
            </div>
            <div>
              <label
                htmlFor="qty-pay2"
                className="text-[11px] uppercase tracking-wider text-zinc-600"
              >
                Quantity
              </label>
              <input
                id="qty-pay2"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={input}
              />
            </div>
          </>
        )}

        <p className="text-[12px] text-[var(--muted-foreground)]">
          Preview:{" "}
          <span className="font-medium text-[var(--foreground)]">
            {displayTitle}
          </span>{" "}
          · {effectiveQty} × {resolvedUnitAud.toFixed(2)} AUD ={" "}
          <span className="font-semibold text-sky-800">{lineTotal.toFixed(2)} AUD</span>
        </p>

        {genError ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {genError}
          </p>
        ) : null}

        <button
          type="button"
          disabled={genPending}
          onClick={() => void handleGenerate()}
          className="moa-cta w-full py-3 text-[11px] font-semibold uppercase tracking-[0.2em] disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {genPending ? "Generating link…" : "Generate on-site payment link"}
        </button>
      </div>

      {payPageUrl ? (
        <div className="mt-10">
          <label
            htmlFor="link-out"
            className="text-[11px] uppercase tracking-wider text-zinc-600"
          >
            On-site payment URL (share with customer)
          </label>
          <textarea
            id="link-out"
            readOnly
            rows={4}
            value={payPageUrl}
            className="mt-2 w-full resize-y border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-900"
          />
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(payPageUrl)}
            className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-800 underline-offset-4 hover:text-sky-950 hover:underline"
          >
            Copy to clipboard
          </button>
        </div>
      ) : null}
    </div>
  );
}
