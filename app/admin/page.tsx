import Link from "next/link";
import { AdminPaymentHistory } from "@/components/admin-payment-history";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminPaymentLinkTool } from "@/components/admin-payment-link-tool";

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-400/70">
            Kuka Arthouse · Super admin
          </p>
          <h1 className="mt-2 bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-xl font-semibold tracking-tight text-transparent">
            Orders &amp; payment links
          </h1>
          <p className="mt-2 max-w-md text-xs text-[var(--muted-foreground)]">
            Generate a payment URL for any AUD total (invoice), from catalog, or
            custom line × quantity — then send the link to the customer to pay.
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-12">
        <AdminPaymentLinkTool />
      </div>

      <AdminPaymentHistory />

      <p className="mt-10 text-center">
        <Link
          href="/"
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-cyan-400"
        >
          ← Storefront
        </Link>
      </p>
    </div>
  );
}
