"use client";

import { useEffect, useState } from "react";

export function AdminCustomerNotes({
  customerId,
  initialNotes,
}: {
  customerId: number;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setNotes(initialNotes ?? "");
  }, [initialNotes]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof body.error === "string" ? body.error : "Save failed.");
        return;
      }
      setMsg("Saved.");
    } catch {
      setErr("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
        Staff notes (CRM)
      </h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        className="mt-3 w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        placeholder="VIP, communication preferences, disputes, follow-ups…"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-zinc-900 px-5 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save notes"}
        </button>
        {msg ? <span className="text-sm font-medium text-emerald-800">{msg}</span> : null}
        {err ? <span className="text-sm font-medium text-red-700">{err}</span> : null}
      </div>
    </form>
  );
}
