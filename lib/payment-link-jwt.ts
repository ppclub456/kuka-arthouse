import { SignJWT, jwtVerify } from "jose";

const AUDIENCE = "kuka-paylink";

function signingKey(): Uint8Array {
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

export type PayLinkClaims = {
  amountAud: number;
  title: string;
  mode: string;
  productId?: string;
};

export async function signPayLinkJWT(claims: PayLinkClaims): Promise<string> {
  return new SignJWT({
    amountAud: claims.amountAud,
    title: claims.title,
    mode: claims.mode,
    productId: claims.productId ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("paylink")
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(signingKey());
}

export async function verifyPayLinkJWT(token: string): Promise<PayLinkClaims> {
  const { payload } = await jwtVerify(token, signingKey(), {
    audience: AUDIENCE,
  });
  const amountAud = Number(payload.amountAud);
  const title =
    typeof payload.title === "string" ? payload.title : "";
  const mode = typeof payload.mode === "string" ? payload.mode : "invoice";
  const productIdRaw =
    typeof payload.productId === "string" ? payload.productId : "";
  if (!Number.isFinite(amountAud) || amountAud < 0.5 || !title) {
    throw new Error("invalid pay link payload");
  }
  return {
    amountAud,
    title: title.slice(0, 240),
    mode,
    ...(productIdRaw ? { productId: productIdRaw } : {}),
  };
}
