"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatMoaPrice } from "@/lib/format";
import { useCart } from "@/context/cart-context";

type Props = {
  product: Product;
  brandName: string;
};

export function ProductCard({ product, brandName }: Props) {
  const router = useRouter();
  const { addProduct } = useCart();
  const categoryTitle = CATEGORY_LABELS[product.category];

  function proceedToCheckout() {
    addProduct(product, 1);
    router.push("/checkout");
  }

  return (
    <article className="group flex flex-col">
      <div className="ai-panel relative aspect-[4/5] w-full overflow-hidden rounded-sm shadow-[0_0_32px_rgba(34,211,238,0.06)] ring-1 ring-cyan-400/15 transition group-hover:shadow-[0_0_40px_rgba(139,92,246,0.12)] group-hover:ring-cyan-400/35">
        <Image
          src={product.imageSrc}
          alt={product.imageAlt}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {/* md+: button only on image hover */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/45 opacity-0 transition-opacity duration-300 md:flex md:group-hover:pointer-events-auto md:group-hover:opacity-100">
          <button
            type="button"
            onClick={proceedToCheckout}
            className="moa-cta px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
      {/* Touch / narrow: no hover — keep button below image */}
      <button
        type="button"
        onClick={proceedToCheckout}
        className="moa-cta mt-3 w-full py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] md:hidden"
      >
        Proceed to Checkout
      </button>
      <div className="mt-3 flex flex-1 flex-col gap-3 md:mt-3">
        <div>
          <h3 className="text-[13px] font-semibold leading-snug text-[var(--foreground)]">
            {product.title}
          </h3>
          <p className="mt-1.5 text-[11px] leading-relaxed text-cyan-400/75">
            by {brandName} in {categoryTitle}
          </p>
          <p className="mt-2 bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-[14px] font-semibold text-transparent">
            {formatMoaPrice(product.priceAud)}
          </p>
        </div>
      </div>
    </article>
  );
}
