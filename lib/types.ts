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
  /** Paragraph shown on listing cards and checkout; emphasises physical print & dimensions */
  description: string;
  /** Whole-dollar amount in AUD (literal decimals are floored in data/products helper `p`) */
  priceAud: number;
  imageSrc: string;
  imageAlt: string;
  category: ProductCategory;
  /** Legacy filter field — storefront uses a single physical-print tag */
  formats: string[];
  license: ProductLicense;
};

export type CartLine = {
  productId: string;
  title: string;
  priceAud: number;
  imageSrc: string;
  quantity: number;
  /** Snapshot at add-to-cart for checkout summary */
  description?: string;
  /** e.g. category label on order summary */
  categoryLabel?: string;
};
