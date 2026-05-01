import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SimulatePayButton } from "@/components/simulate-pay-button";
import { PRODUCTS } from "@/data/products";
import { formatMoaPrice } from "@/lib/format";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseAmount(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 0;
  const n = Number.parseFloat(String(raw));
  return Number.isFinite(n) ? n : 0;
}

function parseQty(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 1;
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function firstString(
  v: string | string[] | undefined,
): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === "string" ? v : v[0];
}

export default async function AdminPayPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!id) notFound();

  const sp = await searchParams;
  const itemRaw = firstString(sp.item);
  const item = itemRaw?.trim() || "Payment";
  const amount = parseAmount(firstString(sp.amount));
  const qty = parseQty(firstString(sp.qty));
  const productId = firstString(sp.productId)?.trim();
  const isInvoiceOrder = firstString(sp.order) === "1";

  const product = productId
    ? PRODUCTS.find((p) => p.id === productId)
    : undefined;

  const displayTitle = product?.title ?? item;
  const lineTotal = amount * qty;

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-slate-500">
        Pay · Kuka Arthouse
        {isInvoiceOrder ? (
          <span className="ml-2 text-cyan-500/80">· invoice</span>
        ) : null}
      </p>
      <h1 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
        {displayTitle}
      </h1>

      {product ? (
        <div className="relative mx-auto mt-6 aspect-square w-full max-w-[220px] overflow-hidden rounded-sm ring-1 ring-cyan-400/20">
          <Image
            src={product.imageSrc}
            alt={product.imageAlt}
            fill
            className="object-cover"
            sizes="220px"
          />
        </div>
      ) : null}

      <dl className="ai-panel mt-8 space-y-3 rounded-sm p-6 text-sm">
        <div className="flex justify-between">
          <dt className="text-[var(--muted-foreground)]">Unit</dt>
          <dd className="text-cyan-200">{formatMoaPrice(amount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--muted-foreground)]">Quantity</dt>
          <dd>{qty}</dd>
        </div>
        <div className="flex justify-between border-t border-[var(--border-dim)] pt-3 font-semibold">
          <dt className="text-[var(--foreground)]">Amount due</dt>
          <dd className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
            {formatMoaPrice(lineTotal)}
          </dd>
        </div>
      </dl>
      <SimulatePayButton />
      <p className="mt-10 text-center text-[11px] text-slate-500">
        <Link href="/" className="hover:text-cyan-400">
          Back to store
        </Link>
      </p>
    </div>
  );
}
