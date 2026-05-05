"use client";

import { useState } from "react";

export function AdminCustomerBackfillButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function run() {
    setLoading(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/admin/customers/backfill", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        emailsProcessed?: number;
        ordersLinked?: number;
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? "Request failed.");
        return;
      }
      setMsg(
        `Done: ${data.emailsProcessed ?? 0} customer email(s), ${data.ordersLinked ?? 0} order row(s) linked.`,
      );
    } catch {
      setErr("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-sm border border-zinc-200 bg-zinc-50/80 p-4 text-sm text-zinc-700">
      <p className="font-semibold text-zinc-900">Backfill from archived orders</p>
      <p className="mt-1 text-zinc-600">
        Scans all paid orders with an email, creates or updates <span className="font-mono">customers</span>{" "}
        from name/phone on the order, and links <span className="font-mono">orders.customer_id</span>. Run this
        once after enabling the customers table, or if older orders were missing links.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={() => void run()}
        className="mt-3 rounded-sm bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? "Running…" : "Sync customers from orders"}
      </button>
      {msg ? (
        <p className="mt-2 font-medium text-emerald-800" role="status">
          {msg}
        </p>
      ) : null}
      {err ? (
        <p className="mt-2 font-medium text-red-700" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
