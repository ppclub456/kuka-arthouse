import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page-shell";
import { STORE_BRAND } from "@/data/products";
import {
  STORE_DISPATCH_REGION,
  STORE_POLICY_LAST_UPDATED,
  STORE_SUPPORT_EMAIL,
} from "@/lib/store-contact";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description: `How ${STORE_BRAND} ships orders from ${STORE_DISPATCH_REGION}.`,
};

export default function ShippingPolicyPage() {
  return (
    <LegalPageShell title="Shipping &amp; Delivery Policy" lastUpdated={STORE_POLICY_LAST_UPDATED}>
      <p>
        This Shipping &amp; Delivery Policy describes how orders placed with{" "}
        {STORE_BRAND} (“we”, “us”) are prepared and sent. Physical items are dispatched from{" "}
        {STORE_DISPATCH_REGION} unless we tell you otherwise in your order confirmation.
      </p>
      <p>
        Standard catalogue pieces are reproduced as physical prints measuring{" "}
        <strong className="text-[var(--foreground)]">{`70 × 100 cm`}</strong>; tracking and packaging details are sent with your fulfilment confirmation.
      </p>

      <h2>1. Order processing time</h2>
      <p>
        We typically allow 1–3 business days to verify payment, prepare, and pack orders.
        Busy periods or made-to-order items may take longer; we will contact you if there is an
        unusual delay.
      </p>

      <h2>2. Domestic shipping ({STORE_DISPATCH_REGION})</h2>
      <p>
        Standard flat-rate postage for eligible domestic orders may be quoted at checkout in AUD,
        inclusive of GST where applicable unless stated otherwise on the invoice. Delivery
        timelines after dispatch commonly range from roughly 3–10 business days depending on your
        location and carrier; these are estimates, not guarantees.
      </p>
      <p>
        Courier or express options may be offered at checkout where available.
      </p>

      <h2>3. International shipping</h2>
      <p>
        International delivery is normally quoted separately. Customers outside{" "}
        {STORE_DISPATCH_REGION} should{" "}
        <a href={`mailto:${STORE_SUPPORT_EMAIL}`} className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          contact us by email ({STORE_SUPPORT_EMAIL})
        </a>{" "}
        before assuming an order can be shipped internationally. We may ask for destination and
        item details so we can provide a freight quotation and timelines.
      </p>
      <p>
        You are responsible for import duties, customs fees, brokerage, and taxes charged in your
        country. Customs delays may occur and are outside our control.
      </p>

      <h2>4. Address accuracy &amp; undelivered parcels</h2>
      <p>
        You must provide a complete delivery address including unit number, postcode, and a
        reachable phone/email. If logistics cannot deliver because details are inadequate, or the
        carrier returns the shipment, extra fees may apply to reship.
      </p>

      <h2>5. Risk &amp; title</h2>
      <p>
        Risk passes to you when goods are handed to the carrier unless applicable law overrides
        that position. Ownership passes when we receive full cleared payment unless law requires a
        different rule.
      </p>

      <h2>6. Carrier delays</h2>
      <p>
        Shipping networks may encounter exceptional delays due to holidays, floods, staffing, or
        border checks. Estimated dates shown at checkout may change; wherever practical we monitor
        consignments and help you escalate with carriers.
      </p>

      <h2>7. Sustainability &amp; packaging</h2>
      <p>
        We endeavour to reuse safe, adequate packaging consistent with preserving rolled or flat-mounted artwork;
        substitutions may vary.
      </p>

      <h2>8. Contact</h2>
      <p>
        Orders or shipping enquiries:{" "}
        <a href={`mailto:${STORE_SUPPORT_EMAIL}`} className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          {STORE_SUPPORT_EMAIL}
        </a>
      </p>
    </LegalPageShell>
  );
}
