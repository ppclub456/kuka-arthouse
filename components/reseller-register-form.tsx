"use client";

import Link from "next/link";
import { useState } from "react";
import { STORE_SUPPORT_EMAIL } from "@/lib/store-contact";

const inputCls =
  "mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400/50";

export function ResellerRegisterForm() {
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [audience, setAudience] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      setDone(true);
    }, 450);
  }

  if (done) {
    return (
      <div className="ai-panel rounded-sm p-8 text-center shadow-[0_0_40px_rgba(99,102,241,0.08)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-400/90">
          Received
        </p>
        <h2 className="mt-3 text-lg font-semibold text-[var(--foreground)]">
          Thanks for applying
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
          We have your reseller application on file. Please also email{" "}
          <a
            href={`mailto:${STORE_SUPPORT_EMAIL}`}
            className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
          >
            {STORE_SUPPORT_EMAIL}
          </a>{" "}
          if you need an immediate reply.
        </p>
        <Link
          href="/"
          className="moa-cta-outline mt-8 inline-block px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]"
        >
          Back to store
        </Link>
      </div>
    );
  }

  return (
    <form className="ai-panel space-y-6 rounded-sm p-6 sm:p-8" onSubmit={handleSubmit}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="res-biz"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80"
          >
            Business / store name <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            id="res-biz"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            autoComplete="organization"
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="res-name"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80"
          >
            Contact name <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            id="res-name"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            autoComplete="name"
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="res-email"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80"
          >
            Email <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            id="res-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="res-phone"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80"
          >
            Phone
          </label>
          <input
            id="res-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="res-country"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80"
          >
            Country / region <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            id="res-country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            autoComplete="country-name"
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="res-web"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80"
          >
            Website or social URL
          </label>
          <input
            id="res-web"
            type="url"
            placeholder="https://"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="res-audience"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80"
          >
            Who do you sell to? <span className="text-[var(--accent)]">*</span>
          </label>
          <textarea
            id="res-audience"
            required
            rows={3}
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g. Boutique homewares retailers, TikTok décor audience…"
            className={`${inputCls} resize-y`}
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="res-notes"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80"
          >
            Anything else?
          </label>
          <textarea
            id="res-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputCls} resize-y`}
          />
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
        By submitting, you agree we use these details only to review your reseller
        application. We may follow up by email.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="moa-cta w-full py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
      >
        {pending ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
