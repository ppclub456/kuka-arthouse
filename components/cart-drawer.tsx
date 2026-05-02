"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { formatMoaPrice } from "@/lib/format";

export function CartDrawer() {
  const {
    drawerOpen,
    closeDrawer,
    lines,
    setQuantity,
    removeLine,
    subtotalAud,
  } = useCart();

  return (
    <Dialog
      open={drawerOpen}
      onClose={closeDrawer}
      className="relative z-50"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition duration-200 data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex justify-end overflow-hidden">
        <DialogPanel
          transition
          className="flex h-full w-full max-w-md transform flex-col border-l border-[var(--border)] bg-[var(--card-solid)]/95 shadow-[0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-xl transition duration-200 data-[closed]:translate-x-full"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <DialogTitle className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/90">
              Cart
            </DialogTitle>
            <button
              type="button"
              onClick={closeDrawer}
              className="text-[11px] uppercase tracking-wider text-slate-400 transition hover:text-cyan-300"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {lines.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Your cart is empty. Browse physical prints ({`70 × 100 cm`}) in the store.
              </p>
            ) : (
              <ul className="space-y-6">
                {lines.map((line) => (
                  <li key={line.productId} className="flex gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-[var(--surface-elevated)] ring-1 ring-cyan-500/20">
                      <Image
                        src={line.imageSrc}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[var(--foreground)]">
                        {line.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {formatMoaPrice(line.priceAud)} each
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <label className="sr-only" htmlFor={`qty-${line.productId}`}>
                          Quantity
                        </label>
                        <input
                          id={`qty-${line.productId}`}
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            setQuantity(
                              line.productId,
                              Number(e.target.value) || 1,
                            )
                          }
                          className="w-14 border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1 text-xs text-[var(--foreground)]"
                        />
                        <button
                          type="button"
                          onClick={() => removeLine(line.productId)}
                          className="text-[11px] uppercase tracking-wider text-slate-500 hover:text-violet-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-[var(--border)] px-6 py-5">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase tracking-[0.15em] text-slate-400">
                Subtotal
              </span>
              <span className="font-medium text-cyan-200">
                {formatMoaPrice(subtotalAud)}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="moa-cta mt-4 flex w-full items-center justify-center px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            >
              Proceed to Checkout
            </Link>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
