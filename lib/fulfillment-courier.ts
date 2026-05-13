/** Stored on `orders.fulfillment_courier` — admin picks carrier for “Track” link. */

export type FulfillmentCourier = "nz_post" | "au_post";

export const FULFILLMENT_COURIERS: { value: FulfillmentCourier; label: string }[] = [
  { value: "nz_post", label: "New Zealand Post" },
  { value: "au_post", label: "Australia Post" },
];

const NZ_TRACK_BASE = "https://www.nzpost.co.nz/tools/tracking?trackid=";
/** Aus Post MyPost search by tracking / article id */
const AU_TRACK_SEARCH = "https://auspost.com.au/mypost/track/#/search?q=";

/** First non-empty line of the tracking field, trimmed (single ID or paste). */
export function extractTrackingToken(raw: string): string | null {
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (t.length > 0) return t;
  }
  return null;
}

/** Opens public carrier tracking; returns null if no token or unknown courier. */
export function carrierTrackingUrl(
  courier: string | null | undefined,
  trackingRaw: string,
): string | null {
  const token = extractTrackingToken(trackingRaw);
  if (!token) return null;
  const enc = encodeURIComponent(token);
  const c = (courier ?? "nz_post").toLowerCase();
  if (c === "au_post") return `${AU_TRACK_SEARCH}${enc}`;
  if (c === "nz_post") return `${NZ_TRACK_BASE}${enc}`;
  return `${NZ_TRACK_BASE}${enc}`;
}

export function normalizeFulfillmentCourier(
  raw: string | null | undefined,
): FulfillmentCourier {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "au_post") return "au_post";
  return "nz_post";
}
