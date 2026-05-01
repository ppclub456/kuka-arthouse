"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Slim bar with staff link — hidden on `/` because the homepage has a full footer. */
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer
      aria-label="Site utilities"
      className="border-t border-[var(--border-dim)] bg-[var(--background)] py-4"
    >
      <div className="mx-auto flex max-w-6xl justify-end px-4 sm:px-6">
        <Link
          href="/admin/login"
          prefetch={false}
          className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)] transition hover:text-cyan-400/90"
        >
          Admin
        </Link>
      </div>
    </footer>
  );
}
