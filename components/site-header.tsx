"use client";

import Link from "next/link";
import { STORE_BRAND } from "@/data/products";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";

export function SiteHeader() {
  const { itemCount, openDrawer } = useCart();
  const { email, logout } = useAuth();

  const shortEmail =
    email && email.length > 22 ? `${email.slice(0, 18)}…` : email;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card-solid)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
          <Link
            href="/"
            className="shrink-0 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-[12px] font-bold uppercase tracking-[0.12em] text-transparent"
          >
            {STORE_BRAND}
          </Link>
          <span className="hidden truncate text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500 sm:inline sm:max-w-[min(280px,28vw)]">
            Digital art &amp; prints
          </span>
        </div>
        <nav className="flex shrink-0 items-center gap-3 sm:gap-8">
          {email ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span
                className="hidden max-w-[140px] truncate text-[10px] text-slate-400 sm:inline"
                title={email}
              >
                {shortEmail}
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-cyan-300"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] transition hover:text-cyan-300"
            >
              Login
            </Link>
          )}
          <Link
            href="/reseller"
            className="max-w-[8.5rem] truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-cyan-300 sm:max-w-none sm:tracking-[0.2em]"
          >
            Become a Reseller
          </Link>
          <button
            type="button"
            onClick={openDrawer}
            className="relative flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]"
            aria-label="Open cart"
          >
            <span aria-hidden>Cart</span>
            {itemCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 px-1.5 text-[10px] font-medium text-white shadow-[0_0_12px_rgba(34,211,238,0.45)]">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            ) : (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-cyan-500/30 text-[10px] text-slate-500">
                0
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
