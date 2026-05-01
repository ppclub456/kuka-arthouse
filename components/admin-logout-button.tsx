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
      className="rounded-sm border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] transition hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50"
    >
      {pending ? "…" : "Log out"}
    </button>
  );
}
