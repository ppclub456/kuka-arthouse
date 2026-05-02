"use client";

import { useCallback, useEffect, useState } from "react";

export type ArchivedOrderRow = {
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
};

function channelLabel(kind: string | null) {
  if (kind === "store") return "Store checkout";
  if (kind === "admin_link") return "Payment link";
  return kind ?? "—";
}

export function AdminOrderArchive() {
  const [rows, setRows] = useState<ArchivedOrderRow[]>([]);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        rows?: ArchivedOrderRow[];
        warning?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not load archived orders.");
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
    void load();
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
    <div className="ai-panel mt-12 rounded-sm p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold uppercase tracking-[0.2em] text-zinc-900 sm:text-lg">
            Archived orders
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-sm border border-[var(--border)] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-900 transition hover:border-sky-500/45 hover:bg-white disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

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

      {loading ? (
        <p className="mt-6 text-base text-[var(--muted-foreground)]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-base text-[var(--muted-foreground)]">
          No archived orders yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-dim)] text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600">
                <th className="py-3 pr-3">When</th>
                <th className="py-3 pr-3">Channel</th>
                <th className="py-3 pr-3">Reference</th>
                <th className="py-3 pr-3">Memo</th>
                <th className="py-3 pr-3">Email</th>
                <th className="py-3 pr-3">Amount</th>
                <th className="py-3 pr-3">Intent</th>
                <th className="py-3">Receipt</th>
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
                    {channelLabel(r.checkoutKind)}
                    {r.adminMode ? (
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        Mode: {r.adminMode}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 align-top font-mono text-sm text-zinc-700">
                    {r.reference ?? "—"}
                  </td>
                  <td className="py-3 pr-3 align-top text-[var(--muted-foreground)]">
                    {r.title ?? "—"}
                  </td>
                  <td className="py-3 pr-3 align-top text-[var(--muted-foreground)]">
                    {r.customerEmail ?? "—"}
                  </td>
                  <td className="py-3 pr-3 align-top tabular-nums font-medium">
                    {(r.currency ?? "AUD").toUpperCase()} {r.amountAud}
                  </td>
                  <td className="py-3 pr-3 align-top font-mono text-xs text-zinc-600">
                    {r.stripePaymentIntentId}
                  </td>
                  <td className="py-3 align-top">
                    {r.receiptUrl ? (
                      <a
                        href={r.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-800 underline-offset-4 hover:text-sky-950 hover:underline"
                      >
                        Stripe
                      </a>
                    ) : (
                      "—"
                    )}
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
