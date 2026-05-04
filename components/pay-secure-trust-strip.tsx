"use client";

import { useId } from "react";

/** Card-brand marks + short security copy for /pay (styled for dark UI). */

/** Networks commonly available via Stripe (varies by country & merchant settings). */

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

/** Monochrome SVG paths from Simple Icons (CC0 1.0). */

const DISCOVER_PATH =
  "M14.58 12a2.023 2.023 0 1 1-2.025-2.023h.002c1.118 0 2.023.906 2.023 2.023zm-5.2-2.001c-1.124 0-2.025.884-2.025 1.99 0 1.118.878 1.984 2.007 1.984.319 0 .593-.063.93-.221v-.873c-.296.297-.559.416-.895.416-.747 0-1.277-.542-1.277-1.312 0-.73.547-1.306 1.243-1.306.354 0 .622.126.93.428v-.873a1.898 1.898 0 0 0-.913-.233zm-3.352 1.545c-.445-.165-.576-.273-.576-.479 0-.239.233-.422.553-.422.222 0 .405.091.598.308l.388-.508a1.665 1.665 0 0 0-1.117-.422c-.673 0-1.186.467-1.186 1.089 0 .524.239.792.936 1.043.291.103.438.171.513.217a.456.456 0 0 1 .222.394c0 .308-.245.536-.576.536-.354 0-.639-.177-.809-.507l-.479.461c.342.502.752.724 1.317.724.771 0 1.311-.513 1.311-1.249-.002-.603-.252-.876-1.095-1.185zM24 10.3a.29.29 0 0 1-.288.291.29.29 0 0 1-.291-.291v-.003A.29.29 0 1 1 24 10.3zm-.059.001a.235.235 0 0 0-.231-.239.234.234 0 0 0-.232.239c0 .132.104.239.232.239a.235.235 0 0 0 .231-.239zM3.472 13.887h.742v-3.803h-.742v3.803zm12.702-1.248l-1.014-2.554h-.81l1.614 3.9h.399l1.643-3.9h-.804l-1.028 2.554zm2.166 1.248h2.104v-.644h-1.362v-1.027h1.312v-.644h-1.312v-.844h1.362v-.644H18.34v3.803zm5.409-3.557l.11.138h-.097l-.094-.13v.13h-.08v-.334h.107c.081 0 .126.036.126.103.001.046-.025.08-.072.093zm-.006-.092c0-.029-.021-.043-.06-.043h-.014v.087h.014c.039 0 .06-.014.06-.044zm-1.228 2.047l1.197 1.602H22.8l-1.027-1.528h-.097v1.528h-.741v-3.803h1.1c.855 0 1.346.411 1.346 1.123 0 .583-.308.965-.866 1.078zm.103-1.038c0-.37-.251-.563-.713-.563h-.228v1.152h.217c.473-.001.724-.207.724-.589zm-19.487.742a1.91 1.91 0 0 1-.69 1.46c-.365.303-.781.439-1.357.439H.001v-3.803H1.09c1.202 0 2.041.781 2.041 1.904zm-.764-.006c0-.364-.154-.718-.411-.947-.245-.222-.536-.308-1.015-.308H.742v2.515h.199c.479 0 .782-.092 1.015-.302.256-.228.411-.593.411-.958z";

const JCB_PATH =
  "M13.05 9.8643c.9723.0736 1.7257.3671 2.3545.6843v-1.31s-1.2577-.3162-2.4408-.368c-4.1256-.1849-5.295 1.4344-5.295 3.1292 0 1.6947 1.1694 3.3145 5.295 3.1296 1.1831-.0536 2.4408-.3694 2.4408-.3694v-1.3086c-.6193.3081-1.3826.6107-2.3545.683-1.6793.1272-2.6898-.6907-2.6898-2.1342 0-1.4448 1.0105-2.2613 2.6898-2.1354m7.685 4.1223c-.0513.0105-.1581.02-.215.02h-1.8005V12.376H20.52c.0568 0 .1636.01.2149.02a.8056.8056 0 01.6325.7951c0 .4162-.2872.721-.6325.796zm-2.0155-4.0374h1.6325c.059 0 .1454.0077.1772.0137.3376.0572.6256.3307.6256.7392 0 .409-.288.6815-.626.7392a1.571 1.571 0 01-.1773.0137h-1.6311V9.9506zm3.4994 1.9856v-.0364c.9133-.1331 1.4149-.726 1.4149-1.4199 0-.8828-.7343-1.3916-1.7293-1.4416-.0772-.0032-.203-.011-.3044-.011h-5.3323v5.9467h5.7548c1.13 0 1.9774-.6043 1.9774-1.5466 0-.8701-.7724-1.4222-1.781-1.4917zm-17.8644.6788c0 .8787-.5906 1.5311-1.6656 1.5311-.917 0-1.8174-.2726-2.6889-.6938V14.76s1.4021.383 3.191.383c2.9714 0 3.8374-1.125 3.8374-2.529V9.0266H4.3541v3.5876Z";

const DINERS_PATH =
  "M16.506 11.982a6.026 6.026 0 0 0-3.866-5.618V17.6a6.025 6.025 0 0 0 3.866-5.618zM8.33 17.598V6.365a6.03 6.03 0 0 0-3.863 5.617 6.028 6.028 0 0 0 3.863 5.616zm2.156-15.113A9.497 9.497 0 0 0 .99 11.982a9.495 9.495 0 0 0 9.495 9.494c5.245 0 9.495-4.25 9.496-9.494a9.499 9.499 0 0 0-9.496-9.497Zm-.023 19.888C4.723 22.4 0 17.75 0 12.09 0 5.905 4.723 1.626 10.463 1.627h2.69C18.822 1.627 24 5.903 24 12.09c0 5.658-5.176 10.283-10.848 10.283";

function AmexMark() {
  return <Badge bg="bg-[#016FD0]" text="AMEX" />;
}

function DiscoverMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 28"
      aria-hidden
      className="h-8 w-[52px] shrink-0"
    >
      <title>Discover</title>
      <rect width="52" height="28" rx="3" fill="#FF6000" />
      <g transform="translate(17 5) scale(0.75)">
        <path fill="#fff" d={DISCOVER_PATH} />
      </g>
    </svg>
  );
}

function UnionPayMark() {
  return (
    <img
      src="/payment-logos/unionpay.svg"
      alt=""
      width={51}
      height={32}
      loading="lazy"
      decoding="async"
      draggable={false}
      className="h-8 w-auto max-w-[4.75rem] shrink-0 rounded-[3px] object-contain brightness-[1.02]"
      aria-hidden
    />
  );
}

/** Tri-color field + white Simple Icons wordmark. */
function JcbMark({ clipId }: { clipId: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 28" aria-hidden className="h-8 w-auto shrink-0">
      <title>JCB</title>
      <rect width="48" height="28" rx="3" fill="#000" fillOpacity={0.35} />
      <defs>
        <clipPath id={clipId}>
          <rect x="3" y="3" width="42" height="22" rx="2" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x="3" y="3" width="14" height="22" fill="#BF0226" />
        <rect x="17" y="3" width="14" height="22" fill="#0868CA" />
        <rect x="31" y="3" width="14" height="22" fill="#42B159" />
      </g>
      <g transform="translate(10 6.5) scale(0.47)">
        <path fill="#fff" d={JCB_PATH} />
      </g>
    </svg>
  );
}

function DinersMark() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 28" aria-hidden className="h-8 w-[40px] shrink-0">
      <title>Diners Club</title>
      <rect width="40" height="28" rx="3" fill="#004A98" />
      <g transform="translate(8 2) scale(0.92)">
        <path fill="#fff" d={DINERS_PATH} />
      </g>
    </svg>
  );
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
  const jcbClipId = `pay-jcb-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div className={`rounded-sm border border-white/10 bg-[var(--surface-elevated)]/35 px-4 py-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Major cards accepted
        </span>
        <div
          className="flex flex-wrap items-center gap-2 sm:gap-2.5"
          aria-label="Visa, Mastercard, American Express, Discover, UnionPay, JCB, Diners Club"
        >
          <VisaMark />
          <MastercardMark />
          <AmexMark />
          <DiscoverMark />
          <UnionPayMark />
          <JcbMark clipId={jcbClipId} />
          <DinersMark />
        </div>
      </div>
      <div className="mt-3 flex gap-2 text-xs leading-relaxed text-slate-400">
        <LockIcon />
        <p>
          <span className="font-medium text-slate-300">Secure payment.</span> Encrypted checkout with
          bank-level standards. Your full card number is never stored on our servers.
        </p>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-slate-500">
        Which brands work depends on your card issuer and country; unsupported cards may be
        declined at checkout.
      </p>
    </div>
  );
}
