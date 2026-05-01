import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-400/80">
        Confirmed
      </p>
      <h1 className="mt-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
        Payment simulated successfully
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
        In production, download links would arrive by email. This prototype ends
        here — your cart has been cleared.
      </p>
      <Link
        href="/"
        className="moa-cta-outline mt-10 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
      >
        Back to shop
      </Link>
    </div>
  );
}
