import type { ProductCategory } from "@/lib/types";

/** Display strings — aligned with Inka Arthouse “Shop Wall Art By Category” */
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  "japanese-art": "Japanese Art",
  "famous-art": "Famous Art",
  "upcoming-artists": "Upcoming Artists",
  "vintage-prints": "Vintage Prints",
  "flower-art": "Floral Art",
  abstract: "Abstract",
};

/** Uppercase tab labels — storefront row */
export const CATEGORY_TAB_UPPER: Record<ProductCategory, string> = {
  "japanese-art": "JAPANESE",
  "famous-art": "FAMOUS",
  "upcoming-artists": "UPCOMING",
  "vintage-prints": "VINTAGE",
  "flower-art": "FLORAL",
  abstract: "ABSTRACT",
};

export const CATEGORY_ORDER: ProductCategory[] = [
  "japanese-art",
  "famous-art",
  "upcoming-artists",
  "vintage-prints",
  "flower-art",
  "abstract",
];

export function parseCategoryParam(
  raw: string | undefined,
): ProductCategory | "all" {
  if (!raw) return "all";
  const allowed: ProductCategory[] = [
    "japanese-art",
    "famous-art",
    "upcoming-artists",
    "vintage-prints",
    "flower-art",
    "abstract",
  ];
  return (allowed as string[]).includes(raw) ? (raw as ProductCategory) : "all";
}
