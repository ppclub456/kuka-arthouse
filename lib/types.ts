export type ProductCategory =
  | "japanese-art"
  | "famous-art"
  | "upcoming-artists"
  | "vintage-prints"
  | "flower-art"
  | "abstract";

/** License tiers — filter labels */
export type ProductLicense = "personal" | "commercial" | "extended";

export type Product = {
  id: string;
  title: string;
  /** Whole-dollar amount in AUD (literal decimals are floored in data/products helper `p`) */
  priceAud: number;
  imageSrc: string;
  imageAlt: string;
  category: ProductCategory;
  /** Subset of storefront format options for filter matching */
  formats: string[];
  license: ProductLicense;
};

export type CartLine = {
  productId: string;
  title: string;
  priceAud: number;
  imageSrc: string;
  quantity: number;
  /** e.g. category label on order summary */
  categoryLabel?: string;
};
