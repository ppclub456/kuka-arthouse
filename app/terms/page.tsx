import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page-shell";
import { STORE_BRAND } from "@/data/products";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${STORE_BRAND}.`,
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of the{" "}
        {STORE_BRAND} website and related services (the &quot;Service&quot;).
        By accessing or purchasing through the Service, you agree to these
        Terms. If you do not agree, please do not use the Service.
      </p>
      <h2>1. Store &amp; products</h2>
      <p>
        We offer digital-art-oriented listings and related storefront features.
        Product images, titles, and prices are shown for demonstration and may be
        updated. Availability and fulfilment details are confirmed at checkout.
      </p>
      <h2>2. Orders &amp; payment</h2>
      <p>
        When you place an order, you offer to purchase at the prices shown
        (typically in AUD) plus any taxes or fees stated at checkout. We may
        refuse or cancel orders in cases of error, fraud risk, or stock or
        system issues.
      </p>
      <h2>3. Guest checkout &amp; login</h2>
      <p>
        Checkout is available without creating an account. Optional login is
        provided for convenience only and does not change your rights under
        these Terms unless we state otherwise in writing.
      </p>
      <h2>4. Intellectual property</h2>
      <p>
        Site design, branding, and original content on this storefront are
        protected by applicable intellectual property laws. Product artwork may
        be subject to third-party rights; use is limited to what your purchase
        and any product-specific licence allow.
      </p>
      <h2>5. Disclaimer</h2>
      <p>
        The Service is provided &quot;as is&quot; to the extent permitted by
        law. We do not warrant uninterrupted or error-free operation.
      </p>
      <h2>6. Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use of the
        Service after changes constitutes acceptance of the revised Terms.
      </p>
      <h2>7. Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a
          href="mailto:support@example.com"
          className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
        >
          support@example.com
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
