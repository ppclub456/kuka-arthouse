"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={pending}
      className="rounded-sm border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-sky-500/50 hover:text-sky-900 disabled:opacity-50"
    >
      {pending ? "…" : "Log out"}
    </button>
  );
}
