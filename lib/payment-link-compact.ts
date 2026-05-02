import { createHmac, timingSafeEqual } from "node:crypto";
import type { PayLinkClaims } from "@/lib/pay-link-types";
import { payLinkSigningKey } from "@/lib/payment-link-signing-key";

/** Compact payload: two base64url segments (payload + sig), much shorter than a JWT for typical memos. */
type CompactWire = {
  v: 1;
  /** Amount in AUD cents */
  c: number;
  /** Unix seconds */
  e: number;
  m: string;
  t: string;
  r: string;
  p: string;
};

const MAX_T = 96;
const MAX_R = 32;
const MAX_M = 12;
const MAX_P = 40;

function b64urlFromUtf8(text: string): string {
  return Buffer.from(text, "utf8").toString("base64url");
}

function utf8FromB64(b64url: string): string {
  return Buffer.from(b64url, "base64url").toString("utf8");
}

function canonicalJson(w: CompactWire): string {
  return JSON.stringify({
    v: w.v,
    c: w.c,
    e: w.e,
    m: w.m,
    t: w.t,
    r: w.r,
    p: w.p,
  });
}

export function signPayLinkCompact(props: {
  amountAud: number;
  title: string;
  mode: string;
  productId?: string;
  reference?: string;
  /** Default 14 days */
  ttlSeconds?: number;
}): string {
  const ttl = props.ttlSeconds ?? 14 * 24 * 60 * 60;
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const cents = Math.round(props.amountAud * 100);
  if (!Number.isFinite(cents) || cents < 50) {
    throw new Error("amount below minimum");
  }
  const wire: CompactWire = {
    v: 1,
    c: cents,
    e: exp,
    m: props.mode.slice(0, MAX_M),
    t: props.title.trim().slice(0, MAX_T),
    r: (props.reference ?? "").trim().slice(0, MAX_R),
    p: (props.productId ?? "").trim().slice(0, MAX_P),
  };
  const canonical = canonicalJson(wire);
  const sig = createHmac("sha256", payLinkSigningKey())
    .update(canonical, "utf8")
    .digest();

  const payloadB64 = b64urlFromUtf8(canonical);
  const sigB64 = Buffer.from(sig).toString("base64url");
  return `${payloadB64}.${sigB64}`;
}

export function verifyPayLinkCompact(fullToken: string): PayLinkClaims {
  const trimmed = fullToken.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 2) {
    throw new Error("invalid compact token");
  }
  const [payloadB64, sigB64] = parts;

  let canonical: string;
  try {
    canonical = utf8FromB64(payloadB64);
  } catch {
    throw new Error("invalid compact token encoding");
  }

  let parsed: CompactWire;
  try {
    parsed = JSON.parse(canonical) as CompactWire;
  } catch {
    throw new Error("invalid compact pay link");
  }

  if (
    parsed.v !== 1 ||
    typeof parsed.c !== "number" ||
    typeof parsed.e !== "number" ||
    typeof parsed.m !== "string" ||
    typeof parsed.t !== "string" ||
    typeof parsed.r !== "string" ||
    typeof parsed.p !== "string"
  ) {
    throw new Error("invalid compact pay link fields");
  }

  const recomputedCanon = canonicalJson(parsed);
  if (recomputedCanon !== canonical) {
    throw new Error("canonical mismatch");
  }

  const expectedSig = createHmac("sha256", payLinkSigningKey())
    .update(canonical, "utf8")
    .digest();

  let provided: Buffer;
  try {
    provided = Buffer.from(sigB64, "base64url");
  } catch {
    throw new Error("invalid signature encoding");
  }
  if (
    provided.length !== expectedSig.length ||
    !timingSafeEqual(provided, expectedSig)
  ) {
    throw new Error("invalid pay link signature");
  }

  if (parsed.e < Math.floor(Date.now() / 1000)) throw new Error("link expired");
  if (!Number.isFinite(parsed.c) || parsed.c < 50) {
    throw new Error("bad amount");
  }
  const amountAud = parsed.c / 100;
  if (!parsed.t.trim()) throw new Error("missing title");

  return {
    amountAud,
    title: parsed.t.trim(),
    mode: parsed.m || "invoice",
    ...(parsed.p ? { productId: parsed.p } : {}),
    ...(parsed.r.trim() ? { reference: parsed.r.trim() } : {}),
  };
}
