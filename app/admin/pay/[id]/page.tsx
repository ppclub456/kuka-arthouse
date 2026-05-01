import Link from "next/link";

/** Legacy URLs no longer mint customer sessions (amount lived in query). */
export default function LegacyAdminPayPage() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-20 text-center sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-500/80">
        Link format retired
      </p>
      <h1 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
        Payments now use Stripe Checkout
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
        Ask your merchant to sign in at <span className="font-mono">/admin/login</span>{" "}
        and generate a new Stripe payment link from the dashboard. Older{" "}
        <span className="font-mono">/admin/pay/…</span> links are inactive.
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
