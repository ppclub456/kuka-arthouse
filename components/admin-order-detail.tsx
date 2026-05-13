"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type CartLineSnapshot = {
  productId: string;
  title: string;
  quantity: number;
  unitAud: number;
  lineTotalAud: number;
};

type DetailPayload = {
  order: {
    id: number;
    createdAtIso: string;
    stripePaymentIntentId: string;
    stripeChargeId: string | null;
    amountAud: string;
    currency: string;
    status: string;
    checkoutKind: string | null;
    adminMode: string | null;
    title: string | null;
    reference: string | null;
    customerEmail: string | null;
    productId: string | null;
    receiptUrl: string | null;
    subtotalAudCents: number | null;
    tipAudCents: number | null;
    shippingAudCents: number | null;
    lineCount: number | null;
    customerId: number | null;
    fulfillmentStatus: string | null;
    internalNote: string | null;
    payLinkCode: string | null;
    shippingName: string | null;
    shippingPhone: string | null;
    shippingLine1: string | null;
    shippingLine2: string | null;
    shippingCity: string | null;
    shippingPostal: string | null;
    shippingCountry: string | null;
    billingName: string | null;
    billingPhone: string | null;
    billingLine1: string | null;
    billingLine2: string | null;
    billingCity: string | null;
    billingPostal: string | null;
    billingCountry: string | null;
    cartLines: CartLineSnapshot[] | null;
  };
  customer: {
    id: number;
    email: string;
    fullName: string | null;
    phone: string | null;
    notes: string | null;
  } | null;
};

const FULFILL_OPTIONS = [
  "unfulfilled",
  "processing",
  "fulfilled",
  "cancelled",
  "refunded",
] as const;

export function AdminOrderDetail({ orderId }: { orderId: number }) {
  const [data, setData] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const [status, setStatus] = useState("unfulfilled");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { credentials: "include" });
      const body = (await res.json().catch(() => ({}))) as DetailPayload & { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not load order.");
        setData(null);
        return;
      }
      if (!body.order) {
        setError("Invalid response from server.");
        setData(null);
        return;
      }
      setData(body as DetailPayload);
      setStatus(body.order.fulfillmentStatus ?? "unfulfilled");
      setNote(body.order.internalNote ?? "");
    } catch {
      setError("Network error.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg("");
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillmentStatus: status, internalNote: note }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Save failed.");
        return;
      }
      setSavedMsg("Saved.");
      void load();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncStripe() {
    setSyncing(true);
    setSyncMsg("");
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/sync-stripe`, {
        method: "POST",
        credentials: "include",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Sync failed.");
        return;
      }
      setSyncMsg(typeof body.message === "string" ? body.message : "Synced from Stripe.");
      void load();
    } catch {
      setError("Network error.");
    } finally {
      setSyncing(false);
    }
  }

  const stripeUrl = () => {
    const pk = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "").toLowerCase();
    const test = pk.includes("test") || process.env.NODE_ENV !== "production";
    const prefix = test ? "/test" : "";
    return `https://dashboard.stripe.com${prefix}/payments/${encodeURIComponent(data?.order.stripePaymentIntentId ?? "")}`;
  };

  function formatAuDate(iso: string) {
    try {
      return new Intl.DateTimeFormat("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  if (loading) {
    return <p className="mt-10 text-[var(--muted-foreground)]">Loading order…</p>;
  }

  if (error || !data) {
    return (
      <p className="mt-10 font-medium text-red-700" role="alert">
        {error || "Missing order"}
      </p>
    );
  }

  const o = data.order;
  const cents = (aud: number | null | undefined): string =>
    typeof aud === "number" ? (aud / 100).toFixed(2) : "—";

  return (
    <div className="mt-10 space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Order #{o.id}
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-900">
            {formatAuDate(o.createdAtIso)} · {(o.currency ?? "AUD").toUpperCase()} {o.amountAud}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Stripe: <span className="font-mono text-xs">{o.stripePaymentIntentId}</span>
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
          {o.customerId ? (
            <Link
              href={`/admin/customers/${o.customerId}`}
              className="rounded-sm border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-900 hover:border-sky-500/40"
            >
              Customer profile
            </Link>
          ) : null}
          <a
            href={stripeUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-900 hover:border-sky-500/40"
          >
            Open in Stripe
          </a>
          <button
            type="button"
            onClick={() => void handleSyncStripe()}
            disabled={syncing}
            className="rounded-sm border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-sky-900 hover:bg-sky-100 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync from Stripe"}
          </button>
          {o.receiptUrl ? (
            <a
              href={o.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-900 hover:border-sky-500/40"
            >
              Receipt
            </a>
          ) : null}
          </div>
          {syncMsg ? (
            <p className="text-xs font-medium text-emerald-800 sm:text-right">{syncMsg}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Order Summary
          </h2>
          <dl className="mt-4 space-y-2 text-sm text-zinc-800">
            {o.adminMode ? (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Quote type</dt>
                <dd>{o.adminMode}</dd>
              </div>
            ) : null}
            {o.payLinkCode ? (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Pay code</dt>
                <dd className="font-mono">{o.payLinkCode}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Order number</dt>
              <dd className="text-right font-mono">{o.reference ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Product</dt>
              <dd className="max-w-[60%] text-right">{o.title ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Payment status</dt>
              <dd className="font-mono text-xs uppercase">{o.status}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Totals
          </h2>
          <dl className="mt-4 space-y-2 text-sm text-zinc-800">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Subtotal</dt>
              <dd className="tabular-nums">{cents(o.subtotalAudCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Tip</dt>
              <dd className="tabular-nums">{cents(o.tipAudCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Shipping</dt>
              <dd className="tabular-nums">{cents(o.shippingAudCents)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-zinc-100 pt-2 font-semibold">
              <dt className="text-zinc-700">Charged</dt>
              <dd className="tabular-nums">{o.amountAud}</dd>
            </div>
            {o.lineCount != null ? (
              <div className="flex justify-between gap-4 text-xs text-zinc-500">
                <dt>Line count</dt>
                <dd>{o.lineCount}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Shipping
          </h2>
          <div className="mt-4 text-sm leading-relaxed text-zinc-800">
            <p className="font-medium">{o.shippingName ?? "—"}</p>
            <p className="text-zinc-600">{o.customerEmail ?? "—"}</p>
            <p className="mt-2">{o.shippingLine1 ?? "—"}</p>
            {o.shippingLine2 ? <p>{o.shippingLine2}</p> : null}
            <p>
              {[o.shippingCity, o.shippingPostal].filter(Boolean).join(" ")}
              {o.shippingCountry ? ` · ${o.shippingCountry}` : ""}
            </p>
            {o.shippingPhone ? (
              <p className="mt-2 text-zinc-600">Phone: {o.shippingPhone}</p>
            ) : null}
          </div>
        </div>
        <div className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Billing
          </h2>
          <div className="mt-4 text-sm leading-relaxed text-zinc-800">
            <p className="font-medium">{o.billingName ?? "—"}</p>
            <p>{o.billingLine1 ?? "—"}</p>
            {o.billingLine2 ? <p>{o.billingLine2}</p> : null}
            <p>
              {[o.billingCity, o.billingPostal].filter(Boolean).join(" ")}
              {o.billingCountry ? ` · ${o.billingCountry}` : ""}
            </p>
            {o.billingPhone ? (
              <p className="mt-2 text-zinc-600">Phone: {o.billingPhone}</p>
            ) : null}
          </div>
        </div>
      </div>

      {o.cartLines && o.cartLines.length > 0 ? (
        <div className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Line items
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Unit</th>
                  <th className="py-2">Line</th>
                </tr>
              </thead>
              <tbody>
                {o.cartLines.map((line, idx) => (
                  <tr
                    key={`${line.productId}-${idx}-${line.title}`}
                    className="border-b border-zinc-100"
                  >
                    <td className="py-2 pr-3">
                      <span className="font-medium">{line.title}</span>
                      <span className="mt-0.5 block font-mono text-xs text-zinc-500">{line.productId}</span>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{line.quantity}</td>
                    <td className="py-2 pr-3 tabular-nums">{line.unitAud.toFixed(2)}</td>
                    <td className="py-2 tabular-nums font-medium">{line.lineTotalAud.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSave}
        className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
          Fulfillment
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            >
              {FULFILL_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {x.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Tracking number
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            placeholder="Courier + tracking URL or ID once shipped."
          />
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-sm bg-zinc-900 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {savedMsg ? (
            <span className="text-sm font-medium text-emerald-800">{savedMsg}</span>
          ) : null}
          {error ? (
            <span className="text-sm font-medium text-red-700">{error}</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
