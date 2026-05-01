"use client";

import { useMemo, useState } from "react";
import { PRODUCTS } from "@/data/products";

type Mode = "catalog" | "custom";

export function AdminPaymentLinkTool() {
  const [mode, setMode] = useState<Mode>("catalog");
  const [productId, setProductId] = useState(PRODUCTS[0]?.id ?? "");
  const [customTitle, setCustomTitle] = useState("");
  const [catalogOverride, setCatalogOverride] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [usePriceOverride, setUsePriceOverride] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [generatedId, setGeneratedId] = useState<string | null>(null);

  const selected = PRODUCTS.find((p) => p.id === productId);

  const resolvedUnitAud = useMemo(() => {
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
  }, [mode, selected, usePriceOverride, catalogOverride, customAmount]);

  const displayTitle =
    mode === "custom"
      ? customTitle.trim() || "Custom payment"
      : selected?.title ?? "Item";

  const linkUrl = useMemo(() => {
    if (typeof window === "undefined" || !generatedId) return "";
    const qty = quantity.trim() || "1";
    const base = window.location.origin;
    const q = new URLSearchParams({
      amount: String(resolvedUnitAud),
      item: displayTitle,
      qty,
    });
    if (mode === "catalog" && productId) {
      q.set("productId", productId);
    }
    return `${base}/admin/pay/${generatedId}?${q.toString()}`;
  }, [
    generatedId,
    resolvedUnitAud,
    displayTitle,
    quantity,
    mode,
    productId,
  ]);

  function handleGenerate() {
    setGeneratedId(crypto.randomUUID());
  }

  const input =
    "mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-cyan-400/50 focus:outline-none";

  const qtyNum = Number.parseInt(quantity, 10);
  const lineTotal =
    resolvedUnitAud * (Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum : 1);

  return (
    <div className="ai-panel rounded-sm p-6 sm:p-8">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-400/80">
        Payment link generator
      </h2>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Create a shareable URL for a customer to review the amount and pay
        (simulated checkout). Use a catalog product, or a fully custom title
        and amount.
      </p>

      <fieldset className="mt-8 space-y-3">
        <legend className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Source
        </legend>
        <div className="flex flex-wrap gap-4">
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
            Custom amount
          </label>
        </div>
      </fieldset>

      <div className="mt-8 space-y-5">
        {mode === "catalog" ? (
          <>
            <div>
              <label
                htmlFor="product-pick"
                className="text-[11px] uppercase tracking-wider text-slate-400"
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
                  className="text-[11px] uppercase tracking-wider text-slate-400"
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
          </>
        ) : (
          <>
            <div>
              <label
                htmlFor="custom-title"
                className="text-[11px] uppercase tracking-wider text-slate-400"
              >
                Description / title
              </label>
              <input
                id="custom-title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className={input}
                placeholder="e.g. Rush fee, Custom commission"
              />
            </div>
            <div>
              <label
                htmlFor="custom-amt"
                className="text-[11px] uppercase tracking-wider text-slate-400"
              >
                Amount (AUD) — unit price
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
          </>
        )}

        <div>
          <label htmlFor="qty-pay" className="text-[11px] uppercase tracking-wider text-slate-400">
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

        <p className="text-[12px] text-[var(--muted-foreground)]">
          Preview:{" "}
          <span className="font-medium text-[var(--foreground)]">
            {displayTitle}
          </span>{" "}
          · {quantity || "1"} × {resolvedUnitAud.toFixed(2)} AUD ={" "}
          <span className="text-cyan-300/90">{lineTotal.toFixed(2)} AUD</span>
        </p>

        <button
          type="button"
          onClick={handleGenerate}
          className="moa-cta w-full py-3 text-[11px] font-semibold uppercase tracking-[0.2em] sm:w-auto sm:px-8"
        >
          Generate payment link
        </button>
      </div>

      {generatedId && (
        <div className="mt-10">
          <label htmlFor="link-out" className="text-[11px] uppercase tracking-wider text-slate-400">
            Shareable URL
          </label>
          <textarea
            id="link-out"
            readOnly
            rows={4}
            value={linkUrl}
            className="mt-2 w-full resize-y border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-mono text-[11px] leading-relaxed text-cyan-100/90"
          />
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(linkUrl)}
            className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}
