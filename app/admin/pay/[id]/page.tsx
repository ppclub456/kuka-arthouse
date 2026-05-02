import Link from "next/link";

/** Legacy URLs — customer payment now uses `/pay` with a signed token. */
export default function LegacyAdminPayPage() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-20 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600 sm:text-sm">
        Retired link
      </p>
      <h1 className="mt-4 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
        Use payment links from the dashboard
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)]">
        Sign in at admin, generate a link, customers pay on <span className="font-mono text-sm">/pay</span>.
      </p>
      <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/admin/login"
          className="moa-cta-outline px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.12em]"
        >
          Admin login
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-700 underline-offset-4 hover:text-sky-900 hover:underline"
        >
          Storefront
        </Link>
      </div>
    </div>
  );
}
