import { TextEncoder } from "node:util";

/** Shared secret bytes for compact pay links & legacy JWT links. */
export function payLinkSigningKey(): Uint8Array {
  const raw =
    process.env.PAYMENT_LINK_SECRET?.trim() ??
    process.env.ADMIN_SESSION_SECRET?.trim() ??
    (process.env.NODE_ENV !== "production"
      ? "dev-kuka-admin-session-secret-min-32-chars!"
      : "");
  if (!raw || raw.length < 16) {
    throw new Error(
      "PAYMENT_LINK_SECRET or ADMIN_SESSION_SECRET required (min 16 chars)",
    );
  }
  return new TextEncoder().encode(raw);
}
