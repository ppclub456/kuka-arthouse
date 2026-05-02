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
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-700 sm:text-sm">
            Kuka Arthouse · Admin
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Orders &amp; payment links
          </h1>
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
          className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-700 transition hover:text-sky-800"
        >
          ← Storefront
        </Link>
      </p>
    </div>
  );
}
