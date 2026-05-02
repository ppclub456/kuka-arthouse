import Link from "next/link";

/** Legacy URLs — customer payment now uses `/pay` with a signed token. */
export default function LegacyAdminPayPage() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-20 text-center sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-500/80">
        Link format retired
      </p>
      <h1 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
        On-site payment links only
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
        Please sign in at <span className="font-mono">/admin/login</span>, then generate an on-site
        payment URL from the admin dashboard — customers complete payment at{" "}
        <span className="font-mono">/pay</span>. Older paths like{" "}
        <span className="font-mono">/admin/pay/…</span> are disabled.
      </p>
      <Link
        href="/"
        className="moa-cta-outline mx-auto mt-10 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
      >
        Back to store
      </Link>
    </div>
  );
}
