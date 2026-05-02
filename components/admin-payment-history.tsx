"use client";

import { useCallback, useEffect, useState } from "react";

type PaymentRow = {
  id: string;
  created: number;
  currency: string;
  paymentStatus: string;
  status: string;
  customerEmail: string | null;
  amountTotal: string;
  checkoutKind: string;
  declineMessage: string | null;
  declineCode: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
};

export function AdminPaymentHistory() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/payments", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        rows?: PaymentRow[];
        warning?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Could not load payment history.");
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

  function formatDate(ms: number) {
    try {
      return new Intl.DateTimeFormat("en-AU", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(ms));
    } catch {
      return "—";
    }
  }

  function kindLabel(k: string) {
    if (k === "store") return "Store cart";
    if (k === "admin_link") return "Admin link";
    return k;
  }

  return (
    <div className="ai-panel mt-12 rounded-sm p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-800">
              Recent PaymentIntents
          </h2>
          <p className="mt-2 max-w-xl text-xs text-[var(--muted-foreground)]">
            Pulled from your Stripe account (latest 35). Card numbers are not shown — only brand and
            last four when available. Failure messages come from Stripe when a payment fails.
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
          No payments recorded yet — items appear after customers submit a payment intent.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-[var(--border-dim)] text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                <th className="py-3 pr-3">When</th>
                <th className="py-3 pr-3">Kind</th>
                <th className="py-3 pr-3">Email</th>
                <th className="py-3 pr-3">Amount</th>
                <th className="py-3 pr-3">Paid</th>
                <th className="py-3 pr-3">Payment intent</th>
                <th className="py-3 pr-3">Card (masked)</th>
                <th className="py-3">Decline / failure</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--border-dim)]/60 text-[var(--foreground)]"
                >
                  <td className="py-3 pr-3 align-top text-[var(--muted-foreground)]">
                    {formatDate(r.created)}
                  </td>
                  <td className="py-3 pr-3 align-top">{kindLabel(r.checkoutKind)}</td>
                  <td className="py-3 pr-3 align-top text-[var(--muted-foreground)]">
                    {r.customerEmail ?? "—"}
                  </td>
                  <td className="py-3 pr-3 align-top font-mono">
                    {r.currency} {r.amountTotal}
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <span
                      className={
                        r.paymentStatus === "paid"
                          ? "font-medium text-emerald-800"
                          : r.paymentStatus === "unpaid"
                            ? "font-medium text-amber-800"
                            : "text-zinc-600"
                      }
                    >
                      {r.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 pr-3 align-top font-mono text-[10px] text-zinc-700">
                    {r.status}
                    <span className="mt-1 block font-normal text-zinc-600">{r.id}</span>
                  </td>
                  <td className="py-3 pr-3 align-top text-[var(--muted-foreground)]">
                    {r.cardBrand && r.cardLast4 ? (
                      <span className="uppercase">
                        {r.cardBrand} ····{r.cardLast4}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 align-top text-[var(--muted-foreground)]">
                    {r.declineMessage
                      ? r.declineMessage
                      : r.declineCode
                        ? String(r.declineCode).replace(/_/g, " ")
                        : r.paymentStatus === "unpaid" &&
                            ["requires_payment_method", "requires_action"].includes(
                              r.status,
                            )
                          ? "Payment incomplete / abandoned"
                          : "—"}
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
