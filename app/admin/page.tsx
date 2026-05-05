import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { AdminPayLinksTable } from "@/components/admin-pay-links-table";
import { AdminPaymentHistory } from "@/components/admin-payment-history";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminPaymentLinkTool } from "@/components/admin-payment-link-tool";

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6">
      <AdminNav />

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-700 sm:text-sm">
            Kuka Arthouse · Admin
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-600">
            Manage payment order links and review archived Stripe checks. Successful storefront and linked
            checkouts sync into Orders when the webhook runs.
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/orders"
          className="rounded-sm border border-zinc-300 bg-white p-6 shadow-sm transition hover:border-sky-500/40 hover:shadow-md"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Order management
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            Orders
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Search paid orders, shipping &amp; billing snapshot, line items, fulfillment status, staff
            notes.
          </p>
        </Link>
        <Link
          href="/admin/customers"
          className="rounded-sm border border-zinc-300 bg-white p-6 shadow-sm transition hover:border-sky-500/40 hover:shadow-md"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            CRM (lightweight)
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            Customers
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Buyer profiles by email, order counts, and internal notes — auto-built from successful
            payments.
          </p>
        </Link>
      </div>

      <div className="mt-12">
        <AdminPaymentLinkTool />
      </div>

      <AdminPayLinksTable />

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
