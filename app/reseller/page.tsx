import type { Metadata } from "next";
import Link from "next/link";
import { ResellerRegisterForm } from "@/components/reseller-register-form";
import { STORE_BRAND } from "@/data/products";

export const metadata: Metadata = {
  title: "Become a reseller",
  description: `Apply to become a reseller for ${STORE_BRAND}.`,
  robots: { index: true, follow: true },
};

export default function ResellerPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-14 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-400/70">
        {STORE_BRAND}
      </p>
      <h1 className="mt-3 bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
        Become a reseller
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
        Apply below to sell our catalog to your audience. Tell us about your business
        and customer base—we will follow up when reseller terms are confirmed.
      </p>

      <div className="mt-10">
        <ResellerRegisterForm />
      </div>

      <p className="mt-10 text-center text-[11px] text-slate-500">
        <Link href="/" className="transition hover:text-cyan-400">
          ← Back to storefront
        </Link>
      </p>
    </div>
  );
}
