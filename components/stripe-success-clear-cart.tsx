"use client";

import { useEffect } from "react";
import { useCart } from "@/context/cart-context";

/** After returning from Stripe success_url, strip cart from browser. */
export function StripeSuccessClearCart({ sessionId }: { sessionId?: string }) {
  const { clearCart } = useCart();

  useEffect(() => {
    if (sessionId) clearCart();
  }, [sessionId, clearCart]);

  return null;
}
