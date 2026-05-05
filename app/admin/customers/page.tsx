import Link from "next/link";
import { AdminCustomerBackfillButton } from "@/components/admin-customer-backfill-button";
import { AdminNav } from "@/components/admin-nav";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { isPgUndefinedColumnError } from "@/lib/admin-api-params";
import { getOrdersDb } from "@/lib/db/client";
import { stripeDashboardCustomerUrl } from "@/lib/stripe-dashboard-url";
import { listCustomersForAdmin } from "@/lib/db/order-admin-queries";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const db = getOrdersDb();

  let rows: Awaited<ReturnType<typeof listCustomersForAdmin>> = [];
  let schemaError: string | null = null;

  if (db) {
    try {
      rows = await listCustomersForAdmin(300);
    } catch (e) {
      console.error("[admin/customers]", e);
      if (isPgUndefinedColumnError(e)) {
        schemaError =
          "Database schema is out of date. Run npm run db:push or apply drizzle/0002_customers_orders_admin.sql and drizzle/0003_customers_stripe_id.sql.";
      } else {
        throw e;
      }
    }
  }

  function formatAuDate(d: Date | null) {
    if (!d) return "—";
    try {
      return new Intl.DateTimeFormat("en-AU", {
        dateStyle: "short",
      }).format(d);
    } catch {
      return "—";
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <AdminNav />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Customers
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Profiles are keyed by payer email after successful Stripe payments. New payments merge name, phone,
            and Stripe Customer id (<span className="font-mono">cus_…</span>) automatically. Use the sync tool
            below to attach historical orders that were missing links.
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      {!db ? (
        <p className="mt-10 font-medium text-amber-900" role="status">
          DATABASE_URL is not set — customer list needs Postgres.
        </p>
      ) : schemaError ? (
        <p className="mt-10 font-medium text-amber-900" role="status">
          {schemaError}
        </p>
      ) : (
        <>
          <AdminCustomerBackfillButton />

          {rows.length === 0 ? (
            <p className="mt-10 text-[var(--muted-foreground)]">
              No customer rows yet. Run &quot;Sync customers from orders&quot; above if you already have archived
              orders with emails.
            </p>
          ) : (
            <div className="ai-panel mt-8 overflow-x-auto rounded-sm p-6 sm:p-8">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-dim)] text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600">
                    <th className="py-3 pr-3">Customer</th>
                    <th className="py-3 pr-3">Phone</th>
                    <th className="py-3 pr-3">Stripe</th>
                    <th className="py-3 pr-3">Orders</th>
                    <th className="py-3 pr-3">Last order</th>
                    <th className="py-3">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[var(--border-dim)]/60 text-[var(--foreground)]"
                    >
                      <td className="py-3 pr-3 align-top">
                        <div className="font-medium text-zinc-900">{c.fullName ?? "—"}</div>
                        <div className="text-zinc-600">{c.email}</div>
                      </td>
                      <td className="py-3 pr-3 align-top text-zinc-600">{c.phone ?? "—"}</td>
                      <td className="py-3 pr-3 align-top">
                        {c.stripeCustomerId ? (
                          <a
                            href={stripeDashboardCustomerUrl(c.stripeCustomerId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-sky-800 underline-offset-4 hover:underline"
                          >
                            {c.stripeCustomerId.length > 22
                              ? `${c.stripeCustomerId.slice(0, 14)}…`
                              : c.stripeCustomerId}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 pr-3 align-top tabular-nums">{c.orderCount}</td>
                      <td className="py-3 pr-3 align-top text-zinc-600">{formatAuDate(c.lastOrderAt)}</td>
                      <td className="py-3 align-top">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="font-semibold text-sky-800 underline-offset-4 hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

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
