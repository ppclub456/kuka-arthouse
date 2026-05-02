"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  code: string;
  title: string;
  reference: string | null;
  mode: string;
  amountAud: string;
  viewCount: number;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  paidAt: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
  expiresAt: string;
};

function statusBadge(r: Row) {
  if (r.paidAt) return { label: "Paid", cls: "text-emerald-800 font-medium" };
  if (
    typeof r.expiresAt === "string" &&
    new Date(r.expiresAt) < new Date()
  ) {
    return { label: "Expired", cls: "text-zinc-500" };
  }
  return { label: "Open", cls: "text-amber-900 font-medium" };
}

export function AdminPayLinksTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pay-links", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        rows?: Row[];
        warning?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not load payment links.");
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

  function fmt(iso: string | null) {
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
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-800">
            Payment links · tracking
          </h2>
          <p className="mt-2 max-w-2xl text-xs text-[var(--muted-foreground)]">
            Each issued 6-letter code: <strong>Open</strong> until paid/expired,&nbsp;
            <strong>Views</strong> increment when someone loads the payment page.&nbsp;
            <strong>Paid</strong> is set via Stripe webhook on successful payment intent.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-sm border border-[var(--border)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-sky-500/45 hover:bg-white disabled:opacity-50"
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
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          No payment links issued yet. Generate one above.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-[var(--border-dim)] text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                <th className="py-3 pr-3">Code</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Views</th>
                <th className="py-3 pr-3">Last view</th>
                <th className="py-3 pr-3">Paid</th>
                <th className="py-3 pr-3">AUD</th>
                <th className="py-3 pr-3">Reference</th>
                <th className="py-3 pr-3">Memo</th>
                <th className="py-3">Intent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                  const badge = statusBadge(r);
                  return (
                    <tr
                      key={`${r.code}-${r.createdAt}`}
                      className="border-b border-[var(--border-dim)]/60"
                    >
                      <td className="py-3 pr-3 align-top font-mono text-[13px] font-semibold text-zinc-900">
                        {r.code}
                      </td>
                      <td className={`py-3 pr-3 align-top ${badge.cls}`}>
                        {badge.label}
                      </td>
                      <td className="py-3 pr-3 align-top tabular-nums">
                        {r.viewCount}
                      </td>
                      <td className="py-3 pr-3 align-top text-[var(--muted-foreground)]">
                        {fmt(r.lastViewedAt)}
                      </td>
                      <td className="py-3 pr-3 align-top text-[var(--muted-foreground)]">
                        {r.paidAt ? fmt(r.paidAt) : "—"}
                      </td>
                      <td className="py-3 pr-3 align-top tabular-nums font-medium">
                        {r.amountAud}
                      </td>
                      <td className="py-3 pr-3 align-top font-mono text-[11px] text-zinc-700">
                        {r.reference ?? "—"}
                      </td>
                      <td className="max-w-[220px] py-3 pr-3 align-top text-[var(--muted-foreground)]">
                        <span className="line-clamp-2">{r.title}</span>
                      </td>
                      <td className="py-3 align-top font-mono text-[10px] text-zinc-500">
                        {r.stripePaymentIntentId ?? "—"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
