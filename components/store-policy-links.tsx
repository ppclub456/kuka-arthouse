import Link from "next/link";

const link =
  "text-cyan-400/85 underline-offset-4 transition hover:text-cyan-300 hover:underline";

type Props = { className?: string; tight?: boolean };

/** Compact inline links — checkout, footer, pay page. */
export function StorePolicyLinks({ className = "", tight }: Props) {
  const sep = tight ? (
    <span className="text-slate-600"> · </span>
  ) : (
    <>
      {" "}
      <span className="text-slate-600">|</span>{" "}
    </>
  );
  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-[11px] text-[var(--muted-foreground)] ${className}`}
      aria-label="Store policies"
    >
      <Link href="/shipping" className={link}>
        Shipping
      </Link>
      {sep}
      <Link href="/refunds" className={link}>
        Refunds
      </Link>
      {sep}
      <Link href="/terms" className={link}>
        Terms
      </Link>
      {sep}
      <Link href="/privacy" className={link}>
        Privacy
      </Link>
      {sep}
      <Link href="/cookies" className={link}>
        Cookies
      </Link>
    </nav>
  );
}
