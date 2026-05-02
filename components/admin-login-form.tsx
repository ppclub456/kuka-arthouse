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
    "mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-3 text-base text-[var(--foreground)] focus:border-cyan-400/50 focus:outline-none";

  return (
    <div className="ai-panel mx-auto max-w-md rounded-sm border border-[var(--border)] p-8 shadow-[0_0_40px_rgba(99,102,241,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-700 sm:text-sm">
        Staff only
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        Admin sign in
      </h1>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="adm-user"
            className="text-sm font-semibold uppercase tracking-wide text-zinc-800"
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
            className="text-sm font-semibold uppercase tracking-wide text-zinc-800"
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
          <p className="text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="moa-cta w-full py-3.5 text-sm font-semibold uppercase tracking-[0.15em] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
