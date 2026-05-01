import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal-page-shell";
import { STORE_BRAND } from "@/data/products";

export const metadata: Metadata = {
  title: "About",
  description: `About ${STORE_BRAND} — a digital art marketplace for prints and creative assets.`,
};

export default function AboutPage() {
  return (
    <LegalPageShell title="About us">
      <p>
        <strong className="text-[var(--foreground)]">{STORE_BRAND}</strong> is a
        digital art destination: we bring together wall-ready prints, curated
        collections, and creative pieces you can browse by mood — from Japanese
        and famous masters to vintage, floral, abstract, and work by upcoming
        artists.
      </p>
      <p>
        Whether you are styling a room, building a portfolio reference, or
        gifting art, we focus on clear categories, fair display pricing in AUD,
        and a checkout that works for everyone — including guests who prefer
        not to create an account.
      </p>
      <h2>Shopping &amp; accounts</h2>
      <p>
        You can shop and complete checkout as a guest anytime. Optional
        customer login is available if you want to return to the store with a
        saved email on this device — there is no separate sign-up flow; login is
        offered only for returning visitors who already have access.
      </p>
      <p>
        <Link
          href="/"
          className="font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
        >
          Browse the store
        </Link>{" "}
        or{" "}
        <Link
          href="/login"
          className="font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
        >
          sign in
        </Link>{" "}
        if you use a customer login.
      </p>
    </LegalPageShell>
  );
}
