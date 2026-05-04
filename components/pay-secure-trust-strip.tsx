/** Card-brand marks + short security copy for /pay (styled for dark UI). */

function Badge({
  bg,
  text,
  className = "",
  narrow,
}: {
  bg: string;
  text: string;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div
      className={`flex h-8 shrink-0 items-center justify-center rounded-[3px] px-2 font-bold tracking-wide text-white ${bg} ${narrow ? "text-[8px]" : "text-[9px]"} ${className}`}
      aria-hidden
    >
      {text}
    </div>
  );
}

function VisaMark() {
  return (
    <div
      className="flex h-8 w-[46px] shrink-0 items-center justify-center rounded-[3px] bg-[#1A1F71]"
      aria-hidden
    >
      <span className="pl-0.5 text-[11px] font-bold italic tracking-[0.06em] text-white">
        VISA
      </span>
    </div>
  );
}

function MastercardMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 24"
      aria-hidden
      className="h-8 shrink-0 w-auto"
    >
      <rect width="40" height="24" rx="3" fill="#000" fillOpacity="0.35" />
      <circle cx="16" cy="12" r="7" fill="#EB001B" />
      <circle cx="24" cy="12" r="7" fill="#F79E1B" />
      <path
        fill="#FF5F00"
        d="M20 7.2a6.9 6.9 0 0 1 0 9.6 6.9 6.9 0 0 1 0-9.6z"
      />
    </svg>
  );
}

function AmexMark() {
  return <Badge bg="bg-[#016FD0]" text="AMEX" />;
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className="size-4 shrink-0 text-emerald-400/90"
    >
      <path
        fillRule="evenodd"
        d="M10 1a3 3 0 0 0-3 3v2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V4a3 3 0 0 0-3-3zm1 5V4a1 1 0 1 0-2 0v2h2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type Props = {
  className?: string;
};

export function PaySecureTrustStrip({ className = "" }: Props) {
  return (
    <div className={`rounded-sm border border-white/10 bg-[var(--surface-elevated)]/35 px-4 py-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Major cards accepted
        </span>
        <div
          className="flex flex-wrap items-center gap-2 sm:gap-2.5"
          aria-label="Visa, Mastercard, American Express"
        >
          <VisaMark />
          <MastercardMark />
          <AmexMark />
        </div>
      </div>
      <div className="mt-3 flex gap-2 text-xs leading-relaxed text-slate-400">
        <LockIcon />
        <p>
          <span className="font-medium text-slate-300">Secure payment.</span> Encrypted checkout with
          bank-level standards. Your full card number is never stored on our servers.
        </p>
      </div>
    </div>
  );
}
