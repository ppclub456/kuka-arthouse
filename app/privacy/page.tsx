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
  title: "Privacy Policy",
  description: `Privacy Policy for ${STORE_BRAND}.`,
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated={STORE_POLICY_LAST_UPDATED}>
      <p>
        This Privacy Policy explains how {STORE_BRAND} (“we”) collects, holds, uses, and discloses
        personal information in connection with {STORE_DISPATCH_REGION}-based storefront operations plus
        global visitors shopping online — consistent with applicable privacy principles including{" "}
        <strong className="text-[var(--foreground)]">Australian Privacy Principle (APP)</strong> schedule
        (Privacy Act 1988 Cth).
      </p>

      <h2>1. Who we are &amp; contact</h2>
      <p>
        Responsible entity enquiries:{" "}
        <a href={`mailto:${STORE_SUPPORT_EMAIL}`} className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          {STORE_SUPPORT_EMAIL}
        </a>
      </p>

      <h2>2. Categories of personal information</h2>
      <ul>
        <li><strong className="text-[var(--foreground)]">Identifiers:</strong> name, postal address, billing address, telephone, IP, approximate geolocation inferred from telemetry.</li>
        <li><strong className="text-[var(--foreground)]">Commercial:</strong> order history, SKU metadata, licences selected, reseller application fields you submit voluntarily.</li>
        <li><strong className="text-[var(--foreground)]">Financial / payment artefacts:</strong> card brand, last-four digits token references (full PAN rests with Stripe), payment attempt outcomes, AML flags surfaced by Stripe.</li>
        <li><strong className="text-[var(--foreground)]">Electronic records:</strong> email threads, lawful recorded calls if any, webhook technical logs aiding dispute resolution.</li>
        <li><strong className="text-[var(--foreground)]">Optional auth profile:</strong> login email &amp; session tokens if optional customer accounts activated.</li>
      </ul>

      <h2>3. How we collect</h2>
      <ul>
        <li>Checkout forms guests complete.</li>
        <li>Automated Stripe.js device integrity signals routed when payment fields mount.</li>
        <li>Server access logs capturing request metadata.</li>
        <li>Optional marketing signups separately consented.</li>
      </ul>

      <h2>4. Purposes</h2>
      <ul>
        <li>Fulfilling orders (<Link href="/shipping" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">Shipping Policy</Link>).</li>
        <li>Risk mitigation, refunds, AML / sanctions screening cooperating with PSP rules.</li>
        <li>Customer support transcripts.</li>
        <li>Analytics improving catalogue navigation when non essential analytic cookies authorised (<Link href="/cookies" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">Cookie Policy</Link>).</li>
        <li>Legal compliance (tax invoicing archives, subpoena fulfilment).</li>
      </ul>

      <h2>5. Legal bases mapping (conceptual AU + cross border)</h2>
      <ul>
        <li>Contract performance fulfilling paid orders.</li>
        <li>Legitimate operational interests moderated against privacy impacts (analytics, uptime insights).</li>
        <li>Consent for optional profiling / marketing bursts.</li>
        <li>Legal obligations mandated by taxation, AML, investigative authorities.</li>
      </ul>

      <h2>6. Disclosures overseas</h2>
      <p>
        Stripe and certain infrastructure suppliers process data internationally (EU, Singapore, US
        regions rotating). Contracts incorporate Standard Contractual Clauses plus Australian APP 8 /
        Accountability schedules where mandated. Copies of core processor DPAs obtainable via their
        public trust centres.
      </p>

      <h2>7. Marketing</h2>
      <p>
        Commercial marketing emails or SMS may be sent where permitted by applicable law — for example
        after you affirmatively subscribe, or otherwise where consent or an allowable exception applies
        in your jurisdiction. You can opt out anytime using unsubscribe links where provided or by emailing{" "}
        <a href={`mailto:${STORE_SUPPORT_EMAIL}`} className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          {STORE_SUPPORT_EMAIL}
        </a>
        . We do not sell your personal contact list to unrelated third‑party advertisers.
      </p>

      <h2>8. Retention</h2>
      <p>
        Transaction ledgers ordinarily seven Australian financial years aligning tax law; dormant
        marketing addresses removed sooner periodically; Stripe retains payment artefacts pursuant to
        their policies longer when fraud regulatory duties warrant.
      </p>

      <h2>9. Security safeguards</h2>
      <p>
        TLS enforced on production hosts, hashed credentials for admin access, segregation of payment
        API keys from application code where practicable. No system is flawless — report suspected
        compromises immediately via {STORE_SUPPORT_EMAIL}.
      </p>

      <h2>10. Automated decision making</h2>
      <p>
        Stripe fraud scoring partly automated informs holds; escalate human review emailing us if a
        false positive blocks checkout though some regulatory holds cannot be circumvented verbally.
      </p>

      <h2>11. Individual rights pathways</h2>
      <ul>
        <li>Australian residents — APP correction / access: email {STORE_SUPPORT_EMAIL} describing request; authenticated evidence may be required guarding others’ confidentiality.</li>
        <li>EU GDPR residents — parallel GDPR Articles 15–22 avenues where extraterritorial processing triggers (analysis fact specific).</li>
        <li>California residents limited CCPA style requests honored where material US nexus evidenced.</li>
      </ul>

      <h2>12. Complaints supervisory authorities</h2>
      <p>
        If unsatisfied escalate to OAIC (<a href="https://www.oaic.gov.au" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline" rel="noopener noreferrer">oaic.gov.au</a>). EU residents contacting lead authority of habitual residence permissible.
      </p>

      <h2>13. Updates</h2>
      <p>
        Revised policies adjust “Last updated” date atop this article; materially invasive collection
        shifts trigger fresh consent checkpoints where mandated.
      </p>

      <h2>14. Cookies</h2>
      <p>
        Detailed cookie classifications are in{" "}
        <Link href="/cookies" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          Cookie Policy
        </Link>
        .
      </p>
    </LegalPageShell>
  );
}
