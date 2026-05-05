import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminOrderDetail } from "@/components/admin-order-detail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage(props: Props) {
  const { id } = await props.params;
  const num = Number.parseInt(id, 10);
  if (!Number.isFinite(num)) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminNav />
        <AdminLogoutButton />
      </div>
      <nav className="mt-6 text-sm">
        <Link href="/admin/orders" className="font-semibold text-sky-800 hover:underline">
          ← Orders
        </Link>
      </nav>
      <AdminOrderDetail orderId={num} />
    </div>
  );
}
