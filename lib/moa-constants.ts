import type { ProductLicense } from "@/lib/types";

/** Storefront filter labels */
export const MOA_FORMAT_OPTIONS = [
  "AI",
  "PSD",
  "PNG",
  "SVG",
  "EPS",
  "TTF/OTF",
] as const;

export const MOA_LICENSE_OPTIONS: {
  id: ProductLicense;
  label: string;
}[] = [
  { id: "personal", label: "Personal Use" },
  { id: "commercial", label: "Commercial Use" },
  { id: "extended", label: "Extended License" },
];
