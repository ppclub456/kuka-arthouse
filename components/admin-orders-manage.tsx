"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/** Mini summary for dashboard / quick lists */
export type OrderListRowApi = {
  id: number;
  createdAtIso: string | null;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  amountAud: string;
  currency: string | null;
  status: string | null;
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
  payLinkCode: string | null;
};

function channelLabel(kind: string | null) {
  if (kind === "store") return "Store";
  if (kind === "admin_link") return "Payment link";
  return kind ?? "—";
}

function fulfillBadge(status: string | null) {
  const s = (status ?? "unfulfilled").toLowerCase();
  if (s === "fulfilled")
    return "bg-emerald-100 text-emerald-950 ring-emerald-500/30";
  if (s === "processing") return "bg-amber-100 text-amber-950 ring-amber-500/30";
  if (s === "cancelled" || s === "refunded")
    return "bg-zinc-200 text-zinc-800 ring-zinc-400/35";
  return "bg-white text-zinc-800 ring-zinc-300/55";
}

type Props = { initialRows?: OrderListRowApi[]; initialWarning?: string };

/** Full admin order list + search — used on `/admin/orders`. */
export function AdminOrdersManage({ initialRows = [], initialWarning = "" }: Props) {
  const [rows, setRows] = useState<OrderListRowApi[]>(initialRows);
  const [warning, setWarning] = useState(initialWarning);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async (search: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      params.set("limit", "250");
      const res = await fetch(`/api/admin/orders?${params}`, { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        rows?: OrderListRowApi[];
        warning?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not load orders.");
        setRows([]);
        return;
      }
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setWarning(data.warning ?? "");
    } catch {
      setError("Network error.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  function formatAuDate(iso: string | null) {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat("en-AU", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(iso));
    } catch {
      return "—";
    }
  }

  return (
    <div className="ai-panel mt-8 rounded-sm p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold uppercase tracking-[0.2em] text-zinc-900 sm:text-lg">
          Orders
        </h2>
        <button
          type="button"
          onClick={() => void load(q)}
          disabled={loading}
          className="rounded-sm border border-[var(--border)] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-900 transition hover:border-sky-500/45 hover:bg-white disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <form
        className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          void load(q);
        }}
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email, reference, memo, payment link code, intent ID…"
          className="w-full flex-1 rounded-sm border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-sm bg-zinc-900 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {warning ? (
        <p className="mt-4 text-sm font-medium text-amber-900" role="status">
          {warning}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {loading && rows.length === 0 ? (
        <p className="mt-6 text-base text-[var(--muted-foreground)]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-base text-[var(--muted-foreground)]">No orders match.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-dim)] text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600">
                <th className="py-3 pr-3">When</th>
                <th className="py-3 pr-3">Fulfillment</th>
                <th className="py-3 pr-3">Channel</th>
                <th className="py-3 pr-3">Customer</th>
                <th className="py-3 pr-3">Reference</th>
                <th className="py-3 pr-3">Memo</th>
                <th className="py-3 pr-3">Amount</th>
                <th className="py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--border-dim)]/60 text-[var(--foreground)]"
                >
                  <td className="py-3 pr-3 align-top text-[var(--muted-foreground)]">
                    {formatAuDate(r.createdAtIso)}
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${fulfillBadge(
                        r.fulfillmentStatus,
                      )}`}
                    >
                      {(r.fulfillmentStatus ?? "unfulfilled").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 pr-3 align-top">
                    {channelLabel(r.checkoutKind)}
                    {r.adminMode ? (
                      <span className="mt-0.5 block text-xs text-zinc-500">{r.adminMode}</span>
                    ) : null}
                    {r.payLinkCode ? (
                      <span className="mt-0.5 block font-mono text-xs text-zinc-500">
                        Code {r.payLinkCode}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <div className="text-[var(--muted-foreground)]">{r.customerEmail ?? "—"}</div>
                    {r.customerId ? (
                      <Link
                        href={`/admin/customers/${r.customerId}`}
                        className="mt-1 inline-block text-xs font-semibold text-sky-800 hover:underline"
                      >
                        Customer #{r.customerId}
                      </Link>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 align-top font-mono text-sm text-zinc-700">
                    {r.reference ?? "—"}
                  </td>
                  <td className="py-3 pr-3 align-top text-[var(--muted-foreground)]">
                    {r.title ?? "—"}
                  </td>
                  <td className="py-3 pr-3 align-top tabular-nums font-medium">
                    {(r.currency ?? "AUD").toUpperCase()} {r.amountAud}
                  </td>
                  <td className="py-3 align-top">
                    <Link
                      href={`/admin/orders/${r.id}`}
                      className="text-sm font-semibold text-sky-800 underline-offset-4 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
