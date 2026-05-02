import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal-page-shell";
import { STORE_BRAND } from "@/data/products";
import {
  STORE_BUSINESS_ADDRESS,
  STORE_SUPPORT_EMAIL,
} from "@/lib/store-contact";

const MAP_SEARCH = encodeURIComponent(STORE_BUSINESS_ADDRESS);

export const metadata: Metadata = {
  title: "Contact",
  description: `${STORE_BRAND} — email ${STORE_SUPPORT_EMAIL}. ${STORE_BUSINESS_ADDRESS}`,
};

export default function ContactPage() {
  return (
    <LegalPageShell title="Contact us">
      <p>
        Questions about orders, shipping, or reseller enquiries? Reach{" "}
        <strong className="text-[var(--foreground)]">{STORE_BRAND}</strong> using
        the details below.
      </p>

      <h2>Email</h2>
      <p>
        <a
          href={`mailto:${STORE_SUPPORT_EMAIL}`}
          className="font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
        >
          {STORE_SUPPORT_EMAIL}
        </a>
      </p>

      <h2>Address</h2>
      <p className="text-[var(--foreground)]">{STORE_BUSINESS_ADDRESS}</p>
      <p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${MAP_SEARCH}`}
          className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
          rel="noopener noreferrer"
          target="_blank"
        >
          Open in Google Maps
        </a>
      </p>

      <p className="pt-4">
        <Link
          href="/"
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400/90 underline-offset-4 hover:text-violet-300 hover:underline"
        >
          Back to store
        </Link>
      </p>
    </LegalPageShell>
  );
}
