"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { CartLine, Product } from "@/lib/types";

const STORAGE_KEY = "kuka-arthouse-cart-v1";

type CartContextValue = {
  lines: CartLine[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addProduct: (product: Product, qty?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeLine: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalAud: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadFromStorage(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as CartLine).productId === "string" &&
        typeof (l as CartLine).quantity === "number",
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Client-only hydration: first paint matches SSR (empty), then restore cart.
    const stored = loadFromStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration after mount
    setLines(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(
    () => setDrawerOpen((o) => !o),
    [],
  );

  const addProduct = useCallback((product: Product, qty = 1) => {
    const n = Math.max(1, Math.floor(qty));
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === product.id);
      if (i === -1) {
        return [
          ...prev,
          {
            productId: product.id,
            title: product.title,
            priceAud: product.priceAud,
            imageSrc: product.imageSrc,
            quantity: n,
            categoryLabel: CATEGORY_LABELS[product.category],
          },
        ];
      }
      const next = [...prev];
      next[i] = {
        ...next[i],
        quantity: next[i].quantity + n,
      };
      return next;
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const q = Math.max(0, Math.floor(quantity));
    setLines((prev) => {
      if (q === 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) =>
        l.productId === productId ? { ...l, quantity: q } : l,
      );
    });
  }, []);

  const removeLine = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const { itemCount, subtotalAud } = useMemo(() => {
    let count = 0;
    let sub = 0;
    for (const l of lines) {
      count += l.quantity;
      sub += l.priceAud * l.quantity;
    }
    return { itemCount: count, subtotalAud: sub };
  }, [lines]);

  const value = useMemo(
    () => ({
      lines,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      addProduct,
      setQuantity,
      removeLine,
      clearCart,
      itemCount,
      subtotalAud,
    }),
    [
      lines,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      addProduct,
      setQuantity,
      removeLine,
      clearCart,
      itemCount,
      subtotalAud,
    ],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
