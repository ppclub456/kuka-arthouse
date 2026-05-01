"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const em = email.trim();
    if (!em || !em.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password.trim()) {
      setError("Enter your password.");
      return;
    }
    login(em);
    router.push("/");
  }

  return (
    <div className="ai-panel mx-auto max-w-md rounded-sm border border-[var(--border)] p-8 shadow-[0_0_40px_rgba(99,102,241,0.08)]">
      <h1 className="bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-xl font-semibold tracking-tight text-transparent">
        Customer login
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
        Sign in to see your saved preferences. Shopping is always available as a
        guest — no account required at checkout.
      </p>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="login-email"
            className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)]"
          />
        </div>
        <div>
          <label
            htmlFor="login-password"
            className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)]"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-400/90" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="moa-cta w-full py-3 text-[10px] font-semibold uppercase tracking-[0.22em]">
          Sign in
        </button>
      </form>
      <p className="mt-6 text-center text-[11px] text-[var(--muted-foreground)]">
        Store staff generating payment links?{" "}
        <Link
          href="/admin/login"
          className="font-medium text-violet-400 underline-offset-4 hover:text-violet-300 hover:underline"
        >
          Super admin sign in
        </Link>{" "}
        — use username + password from your host (not customer email login).
      </p>
      <p className="mt-8 border-t border-[var(--border-dim)] pt-6 text-center text-[12px] text-[var(--muted-foreground)]">
        <Link
          href="/"
          className="font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
        >
          Continue shopping
        </Link>{" "}
        — guest checkout is available at any time.
      </p>
    </div>
  );
}
