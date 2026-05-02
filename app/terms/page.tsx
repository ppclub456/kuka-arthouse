import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal-page-shell";
import { STORE_BRAND } from "@/data/products";
import {
  STORE_DISPATCH_REGION,
  STORE_POLICY_LAST_UPDATED,
  STORE_SUPPORT_EMAIL,
} from "@/lib/store-contact";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${STORE_BRAND}.`,
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated={STORE_POLICY_LAST_UPDATED}>
      <p>
        These Terms of Service (“Terms”) govern your use of the {STORE_BRAND} website and related
        storefront services (“Services”). By browsing, placing an order, or submitting information
        through the Services you agree to these Terms and our linked policies (
        <Link href="/privacy" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          Privacy Policy
        </Link>
        ,{" "}
        <Link href="/shipping" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          Shipping Policy
        </Link>
        ,{" "}
        <Link href="/refunds" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          Refunds Policy
        </Link>
        ).
      </p>

      <h2>1. Who we are</h2>
      <p>
        {STORE_BRAND} operates principally from {STORE_DISPATCH_REGION}. For legal, shipping, billing,
        and support enquiries:{" "}
        <a href={`mailto:${STORE_SUPPORT_EMAIL}`} className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          {STORE_SUPPORT_EMAIL}
        </a>
        .
      </p>

      <h2>2. Australian Consumer Law</h2>
      <p>
        Our goods and services come with statutory guarantees that cannot be excluded under the Australian
        Consumer Law. Details and how refunds work are outlined in our{" "}
        <Link href="/refunds" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          Refunds Policy
        </Link>
        .
      </p>

      <h2>3. Orders, pricing, and GST</h2>
      <p>
        Listing prices are usually shown in Australian dollars (AUD). Where GST applies it is
        included in the advertised price unless we clearly separate them at checkout or on the invoice.
        We reserve the right to correct pricing mistakes and to refuse or cancel an order affected by such
        an error prior to fulfilment where permitted by law.
      </p>

      <h2>4. Payment processing (Stripe)</h2>
      <p>
        Card and wallet payments are processed by Stripe (<a href="https://stripe.com" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline" rel="noopener noreferrer">
          stripe.com
        </a>
        ). Your card details are entered in embedded Stripe fields on our site; we do not ask you to
        email full payment card numbers. Stripe’s privacy and processing terms apply in addition to
        ours (
        <Link href="/privacy" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          Privacy Policy
        </Link>
        ).
      </p>

      <h2>5. Shipping and delivery</h2>
      <p>
        Dispatched primarily from {STORE_DISPATCH_REGION}; delivery times and international quotes are as
        described in our{" "}
        <Link href="/shipping" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          Shipping Policy
        </Link>
        . International shoppers should contact{" "}
        <a href={`mailto:${STORE_SUPPORT_EMAIL}`} className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          {STORE_SUPPORT_EMAIL}
        </a>{" "}
        before ordering if freight is not shown at checkout.
      </p>

      <h2>6. Returns and refunds</h2>
      <p>
        See{" "}
        <Link href="/refunds" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          Returns &amp; Refund Policy
        </Link>{" "}
        for cancellations, faults, discretionary change-of-mind rules, and how refunds are credited.
      </p>

      <h2>7. Products, licences, and intellectual property</h2>
      <p>
        Descriptions and images summarise each item’s nature and licence type (such as personal or
        commercial use). Unless the product page or your purchase confirms otherwise, you receive only
        the rights stated for that SKU. Misuse beyond the stated licence may infringe intellectual
        property or third‑party rights.
      </p>

      <h2>8. Prohibited use</h2>
      <p>
        Do not misuse the Services (including fraud, unlawful resale of access, attempting to circumvent
        security, scraping in violation of robots or rate limits, or harassing our team). We may suspend or
        limit access where misuse is suspected, subject to statutory rights that apply to you as a consumer.
      </p>

      <h2>9. Limitation where law allows</h2>
      <p>
        Except where ACL or another law forbids exclusions, liability for foreseeable loss arising from our
        supply of goods or Services is capped at remedies those laws prescribe. Nothing in these Terms excludes
        or limits statutory consumer guarantees or non‑excludable terms.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these Terms periodically. Updates take effect once published with a new “Last
        updated” date. Continuing to use the Services after changes constitutes acceptance unless a stricter rule applies under law for existing prepaid orders or outstanding disputes.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href={`mailto:${STORE_SUPPORT_EMAIL}`} className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          {STORE_SUPPORT_EMAIL}
        </a>
      </p>
    </LegalPageShell>
  );
}
