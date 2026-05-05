import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminCustomerNotes } from "@/components/admin-customer-notes";
import { stripeDashboardCustomerUrl } from "@/lib/stripe-dashboard-url";
import { isPgUndefinedColumnError } from "@/lib/admin-api-params";
import { getOrdersDb } from "@/lib/db/client";
import { getCustomerByIdForAdmin } from "@/lib/db/order-admin-queries";

export const dynamic = "force-dynamic";

type Props = { params?: Promise<{ id?: string | string[] }> };

export default async function AdminCustomerDetailPage(props: Props) {
  const p = (await props.params) ?? {};
  const raw = p.id;
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  const num = typeof idStr === "string" ? Number.parseInt(idStr.trim(), 10) : NaN;
  if (!Number.isFinite(num) || num < 1) notFound();

  const db = getOrdersDb();
  if (!db) {
    return (
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6">
        <AdminNav />
        <p className="mt-10 font-medium text-amber-900" role="status">
          Database is not configured (DATABASE_URL). Customer pages need Postgres.
        </p>
        <p className="mt-4">
          <Link href="/admin/customers" className="text-sky-800 hover:underline">
            ← Customers
          </Link>
        </p>
      </div>
    );
  }

  let data: Awaited<ReturnType<typeof getCustomerByIdForAdmin>>;
  try {
    data = await getCustomerByIdForAdmin(num);
  } catch (e) {
    console.error("[admin/customers/[id]]", e);
    if (isPgUndefinedColumnError(e)) {
      return (
        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6">
          <AdminNav />
          <p className="mt-10 font-medium text-amber-900" role="status">
            Database schema is out of date. Run{" "}
            <code className="rounded bg-zinc-200 px-1 text-sm">npm run db:push</code>
            {" "}or apply <code className="rounded bg-zinc-200 px-1 text-sm">drizzle/0002_*</code> and{" "}
            <code className="rounded bg-zinc-200 px-1 text-sm">0003_*</code>.
          </p>
          <p className="mt-4">
            <Link href="/admin/customers" className="text-sky-800 hover:underline">
              ← Customers
            </Link>
          </p>
        </div>
      );
    }
    throw e;
  }

  if (!data) notFound();

  const { customer, orders: ords } = data;

  function formatAuDate(d: Date) {
    try {
      return new Intl.DateTimeFormat("en-AU", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(d);
    } catch {
      return "—";
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminNav />
        <AdminLogoutButton />
      </div>

      <nav className="mt-6 text-sm">
        <Link href="/admin/customers" className="font-semibold text-sky-800 hover:underline">
          ← Customers
        </Link>
      </nav>

      <header className="mt-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Customer #{customer.id}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{customer.fullName ?? "—"}</h1>
        <p className="mt-1 text-sm text-zinc-600">{customer.email}</p>
        {customer.phone ? (
          <p className="mt-1 text-sm text-zinc-600">Phone: {customer.phone}</p>
        ) : null}
        {customer.stripeCustomerId ? (
          <p className="mt-2 text-sm text-zinc-600">
            Stripe:{" "}
            <a
              href={stripeDashboardCustomerUrl(customer.stripeCustomerId)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-sky-800 underline-offset-4 hover:underline"
            >
              {customer.stripeCustomerId}
            </a>
          </p>
        ) : null}
      </header>

      <div className="mt-10">
        <AdminCustomerNotes customerId={customer.id} initialNotes={customer.notes} />
      </div>

      <div className="ai-panel mt-10 rounded-sm p-6 sm:p-8">
        <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-zinc-900">
          Order history
        </h2>
        {ords.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">No linked orders yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-dim)] text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Fulfillment</th>
                  <th className="py-2 pr-3">Memo</th>
                  <th className="py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {ords.map((o) => (
                  <tr key={o.id} className="border-b border-[var(--border-dim)]/60">
                    <td className="py-2 pr-3 text-zinc-600">{formatAuDate(o.createdAt)}</td>
                    <td className="py-2 pr-3 tabular-nums font-medium">
                      {(o.currency ?? "AUD").toUpperCase()} {(o.amountAudCents / 100).toFixed(2)}
                    </td>
                    <td className="py-2 pr-3 text-xs uppercase">{o.fulfillmentStatus ?? "—"}</td>
                    <td className="py-2 pr-3 max-w-[200px] truncate text-zinc-600">{o.title ?? "—"}</td>
                    <td className="py-2">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-sky-800 hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
