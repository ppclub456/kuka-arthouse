import Link from "next/link";
import { AdminOrderArchive } from "@/components/admin-order-archive";
import { AdminPayLinksTable } from "@/components/admin-pay-links-table";
import { AdminPaymentHistory } from "@/components/admin-payment-history";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminPaymentLinkTool } from "@/components/admin-payment-link-tool";

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-700">
            Kuka Arthouse · Super admin
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">
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

      <AdminPayLinksTable />

      <AdminOrderArchive />

      <AdminPaymentHistory />

      <p className="mt-10 text-center">
        <Link
          href="/"
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600 transition hover:text-sky-800"
        >
          ← Storefront
        </Link>
      </p>
    </div>
  );
}
