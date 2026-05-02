import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page-shell";
import { STORE_BRAND } from "@/data/products";
import {
  STORE_POLICY_LAST_UPDATED,
  STORE_SUPPORT_EMAIL,
} from "@/lib/store-contact";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `${STORE_BRAND} use of cookies and similar technologies.`,
};

export default function CookiePolicyPage() {
  return (
    <LegalPageShell title="Cookie Policy" lastUpdated={STORE_POLICY_LAST_UPDATED}>
      <p>
        {STORE_BRAND} (“we”) uses cookies and similar browser storage mechanisms on{" "}
        <strong className="text-[var(--foreground)]">our website storefront</strong> to operate securely,
        remember preferences where applicable, analyse traffic counts (if analytic cookies are switched
        on), and cooperate with Stripe.js fraud prevention tooling where payment pages load Stripe
        elements.
      </p>

      <h2>1. Essential cookies</h2>
      <p>
        Required for browsing the shop, carts, authenticated admin sessions behind login, resilience
        against abusive traffic patterns, remembering cookie consent banners (if deployed), TLS
        session continuity across edge nodes. These persist only as operationally justified.
      </p>

      <h2>2. Functional preference cookies</h2>
      <p>
        Optional choices like theme previews, recently viewed SKU highlights, persisted guest email
        prefill snippets — discarded or anonymised periodically.
      </p>

      <h2>3. Analytics cookies</h2>
      <p>
        Aggregate audience metrics (sessions, referrer page, device class) aid merchandising tuning.
        You may disallow non essential analytics through our consent UI if present, or instruct your
        browser to block cookies—note parts of checkout could degrade if Stripe requires certain
        first party storage for Fraud signals.
      </p>

      <h2>4. Payment partner technologies</h2>
      <p>
        Card collecting fields inside embedded Stripe Elements may set cookies or analogous storage
        under Stripe domains subject to Stripe’s own Cookie / Privacy Statements. Inspect network
        tab or Stripe disclosures for updated inventory.
      </p>

      <h2>5. Managing cookies</h2>
      <ul>
        <li>Modern browsers expose site data clearing and per site cookie dashboards.</li>
        <li>Private browsing wipes session cookies closing the window.</li>
        <li>Opt out links for broader ad tech (Apple ATT, Android advertising ID resets) reside with device vendors beyond this shop.</li>
      </ul>

      <h2>6. Contact</h2>
      <p>
        Cookies &amp; privacy questions:{" "}
        <a href={`mailto:${STORE_SUPPORT_EMAIL}`} className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          {STORE_SUPPORT_EMAIL}
        </a>
        {" "}(references our{" "}
        <a href="/privacy" className="text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline">
          Privacy Policy
        </a>
        ).
      </p>
    </LegalPageShell>
  );
}
