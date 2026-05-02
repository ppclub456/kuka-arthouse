import { SignJWT, jwtVerify } from "jose";
import type { PayLinkClaims } from "@/lib/pay-link-types";
import { payLinkSigningKey } from "@/lib/payment-link-signing-key";

const AUDIENCE = "kuka-paylink";

export async function signPayLinkJWT(claims: PayLinkClaims): Promise<string> {
  return new SignJWT({
    amountAud: claims.amountAud,
    title: claims.title,
    mode: claims.mode,
    productId: claims.productId ?? "",
    reference: claims.reference ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("paylink")
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(payLinkSigningKey());
}

export async function verifyPayLinkJWT(token: string): Promise<PayLinkClaims> {
  const { payload } = await jwtVerify(token, payLinkSigningKey(), {
    audience: AUDIENCE,
  });
  const amountAud = Number(payload.amountAud);
  const title = typeof payload.title === "string" ? payload.title : "";
  const mode = typeof payload.mode === "string" ? payload.mode : "invoice";
  const productIdRaw =
    typeof payload.productId === "string" ? payload.productId : "";
  const referenceRaw =
    typeof payload.reference === "string" ? payload.reference : "";

  const ref = referenceRaw.trim();
  if (
    !Number.isFinite(amountAud) ||
    amountAud < 0.5 ||
    !title
  ) {
    throw new Error("invalid pay link payload");
  }
  return {
    amountAud,
    title: title.slice(0, 240),
    mode,
    ...(productIdRaw ? { productId: productIdRaw } : {}),
    ...(ref ? { reference: ref.slice(0, 64) } : {}),
  };
}
