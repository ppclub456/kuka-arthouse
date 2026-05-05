import Link from "next/link";
import { AdminOrdersManage } from "@/components/admin-orders-manage";
import { AdminNav } from "@/components/admin-nav";
import { AdminLogoutButton } from "@/components/admin-logout-button";

export default function AdminOrdersPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <AdminNav />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Order management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Archived from successful Stripe payments. Update fulfillment status and staff notes —
            storefront or merchant-issued payment order links appear here once the webhook fires.
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      <AdminOrdersManage />

      <p className="mt-10">
        <Link
          href="/admin"
          className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-700 transition hover:text-sky-800"
        >
          ← Admin dashboard
        </Link>
      </p>
    </div>
  );
}
