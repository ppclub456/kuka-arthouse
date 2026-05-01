"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";

export function SimulatePayButton() {
  const router = useRouter();
  const { clearCart } = useCart();

  function handleClick() {
    clearCart();
    router.push("/success");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="moa-cta mt-8 w-full py-3.5 text-[11px] font-semibold uppercase tracking-[0.25em]"
    >
      Simulate successful payment
    </button>
  );
}
