import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page-shell";
import { STORE_BRAND } from "@/data/products";
import {
  STORE_DISPATCH_REGION,
  STORE_POLICY_LAST_UPDATED,
  STORE_SUPPORT_EMAIL,
} from "@/lib/store-contact";

export const metadata: Metadata = {
  title: "Returns & Refund Policy",
  description: `${STORE_BRAND} returns, refunds, and Australian Consumer Law summary.`,
};

export default function RefundsPolicyPage() {
  return (
    <LegalPageShell title="Returns &amp; Refund Policy" lastUpdated={STORE_POLICY_LAST_UPDATED}>
      <p>
        At {STORE_BRAND} (“we”) we aim to settle issues fairly if something goes wrong or you
        change your mind subject to eligibility and statutory rights.
      </p>

      <h2>1. Australian Consumer Law (ACL)</h2>
      <p>
        Nothing in this policy limits statutory rights Australians have under the Competition and
        Consumer Act and related ACL provisions. Certain goods supplied in trade may come with{" "}
        <strong className="text-[var(--foreground)]">automatic consumer guarantees</strong> —
        acceptable quality, fitness for purpose, matching description, spare parts/support as
        required by law — that cannot lawfully be excluded.
      </p>
      <p>
        Where a statutory major failure arises, remedies may include a refund or replacement. For
        non-major failures where repair or replacement remains possible, statutory remedies vary.
        Consumers can learn more via the ACCC (<a href="https://www.accc.gov.au" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline" rel="noopener noreferrer">accc.gov.au</a>) or their state/territory fair trading office.
      </p>

      <h2>2. Incorrect, damaged, or missing items</h2>
      <p>
        If goods arrive materially damaged or not as stated, notify us promptly with photographic
        evidence and your order number. Subject to ACL and fairness, we will arrange replacements,
        store credit, refunds, or other remedy we agree suits the situation once return or
        disposition steps are clarified.
      </p>

      <h2>3. Change of mind (non statutory)</h2>
      <p>
        You may notify us within 14 days after delivery requesting a discretionary change-of-mind remedy
        offered at our goodwill. Acceptance depends on the product type:
      </p>
      <ul>
        <li>
          Physical prints eligible for discretionary return generally must arrive back to us unused,
          resaleable packaging where practical, freight prepaid unless we agree otherwise, and bear
          the original identifiers.
        </li>
        <li>
          Printed or customised items made to specification may have limited or no discretionary
          return entitlement once manufacture starts.
        </li>
      </ul>

      <h2>4. Refunds to your payment card</h2>
      <p>
        Approved refunds return to your original payment method where possible via our payments
        provider, Stripe (<a href="https://stripe.com" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline" rel="noopener noreferrer">stripe.com</a>). Refunds typically appear within several business days depending on your card issuer.
      </p>

      <h2>5. Order cancellation prior to fulfilment</h2>
      <p>
        If you withdraw before fulfilment ships and statutory rights unaffected, contact us ASAP.
        Paid reserved stock may incur restocking deductions only where goods were held solely for you
        and law permits charging preparatory labour.
      </p>

      <h2>6. Disputed card charges (“chargebacks”)</h2>
      <p>
        Please email us prior to escalating to your issuer so billing queries can reconcile quickly —
        unauthorised charges or mistakes can often be refunded instead of lengthening disputes.
      </p>

      <h2>7. Territory</h2>
      <p>
        Our primary place of business is {STORE_DISPATCH_REGION}. Overseas buyers still receive
        applicable mandatory protections in addition to discretionary policies above whenever those
        laws apply to the transaction.
      </p>

      <h2>8. How to lodge a refund or return enquiry</h2>
      <p>
        Email{" "}
        <a href={`mailto:${STORE_SUPPORT_EMAIL}`} className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          {STORE_SUPPORT_EMAIL}
        </a>{" "}
        citing order confirmation number, SKU/title purchased, concise issue statement, attachments as
        needed, preferred remedy. We ordinarily respond inside a few AU business days.
      </p>
    </LegalPageShell>
  );
}
