import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page-shell";
import { STORE_BRAND } from "@/data/products";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${STORE_BRAND}.`,
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <p>
        {STORE_BRAND} (&quot;we&quot;, &quot;us&quot;) respects your privacy.
        This Privacy Policy explains what we collect when you use our website
        and storefront (the &quot;Service&quot;), how we use it, and your
        choices.
      </p>
      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong className="text-[var(--foreground)]">Checkout &amp; orders:</strong>{" "}
          name, email, shipping or billing details, and order contents that you
          submit during purchase.
        </li>
        <li>
          <strong className="text-[var(--foreground)]">Optional login:</strong> if
          you use customer login on this demo storefront, your email may be
          stored locally in your browser to personalise the session.
        </li>
        <li>
          <strong className="text-[var(--foreground)]">Technical data:</strong>{" "}
          standard logs and cookies as needed for security, analytics, or site
          operation (where enabled).
        </li>
      </ul>
      <h2>2. How we use information</h2>
      <p>We use information to process orders, communicate about purchases, improve the Service, prevent fraud, and comply with law.</p>
      <h2>3. Sharing</h2>
      <p>
        We may share data with payment processors, shipping partners, and
        service providers who assist in operating the store, subject to
        appropriate safeguards. We do not sell your personal information.
      </p>
      <h2>4. Retention</h2>
      <p>
        We keep information only as long as needed for the purposes above,
        including legal, tax, and accounting requirements.
      </p>
      <h2>5. Your choices</h2>
      <p>
        You may request access, correction, or deletion of certain personal
        data where applicable law allows. For guest orders, contact us with your
        order details so we can verify your request.
      </p>
      <h2>6. Children</h2>
      <p>
        The Service is not directed at children under 13 (or the age required by
        your region). We do not knowingly collect their personal data.
      </p>
      <h2>7. Updates</h2>
      <p>
        We may update this Privacy Policy. The &quot;Last updated&quot; notion
        is reflected when we publish changes on this page.
      </p>
      <h2>8. Contact</h2>
      <p>
        Privacy questions:{" "}
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
