import { verifyPayLinkCompact } from "@/lib/payment-link-compact";
import type { PayLinkClaims } from "@/lib/pay-link-types";
import { verifyPayLinkJWT } from "@/lib/payment-link-jwt";

/** Three segments = HS256 JWT; two segments = compact HMAC payload (shorter URLs). */
export async function verifyPaymentLinkToken(raw: string): Promise<PayLinkClaims> {
  const trimmed = raw.trim();
  const n = trimmed.split(".").length - 1;
  if (n === 2) {
    try {
      return await verifyPayLinkJWT(trimmed);
    } catch {
      throw new Error("invalid legacy pay link token");
    }
  }
  if (n === 1) {
    return verifyPayLinkCompact(trimmed);
  }
  throw new Error("unrecognized pay link format");
}
