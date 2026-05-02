"use client";

import { useEffect } from "react";
import { useCart } from "@/context/cart-context";

/** Clear cart after embedded card flow or legacy hosted return. */
export function StripeSuccessClearCart({
  sessionId,
  paymentIntentId,
}: {
  sessionId?: string;
  paymentIntentId?: string;
}) {
  const { clearCart } = useCart();

  useEffect(() => {
    if (sessionId || paymentIntentId) clearCart();
  }, [sessionId, paymentIntentId, clearCart]);

  return null;
}
