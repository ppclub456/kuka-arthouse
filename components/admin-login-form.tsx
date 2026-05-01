"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/admin")) return "/admin";
  if (raw.includes("//")) return "/admin";
  if (raw.startsWith("/admin/pay")) return "/admin";
  return raw;
}

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Login failed");
        setPending(false);
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  const input =
    "mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-cyan-400/50 focus:outline-none";

  return (
    <div className="ai-panel mx-auto max-w-md rounded-sm border border-[var(--border)] p-8 shadow-[0_0_40px_rgba(99,102,241,0.08)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-400/70">
        Staff only
      </p>
      <h1 className="mt-2 bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-xl font-semibold tracking-tight text-transparent">
        Super admin sign in
      </h1>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Create payment links / orders for customers. Not linked from the public
        storefront. Use{" "}
        <code className="rounded bg-[var(--surface-elevated)] px-1 text-[10px] text-cyan-200/80">
          SUPER_ADMIN_*
        </code>{" "}
        or{" "}
        <code className="rounded bg-[var(--surface-elevated)] px-1 text-[10px] text-cyan-200/80">
          ADMIN_*
        </code>{" "}
        credentials from your environment.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="adm-user"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80"
          >
            Username
          </label>
          <input
            id="adm-user"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={input}
            required
          />
        </div>
        <div>
          <label
            htmlFor="adm-pass"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80"
          >
            Password
          </label>
          <input
            id="adm-pass"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-red-400/90" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="moa-cta w-full py-3 text-[10px] font-semibold uppercase tracking-[0.22em] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
