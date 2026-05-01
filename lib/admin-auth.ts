import { jwtVerify, SignJWT } from "jose";

const COOKIE_NAME = "kuka_admin_session";

function getSecretKey(): Uint8Array {
  const raw =
    process.env.ADMIN_SESSION_SECRET ??
    (process.env.NODE_ENV !== "production"
      ? "dev-kuka-admin-session-secret-min-32-chars!"
      : "");
  if (!raw || raw.length < 16) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set (at least 16 characters).",
    );
  }
  return new TextEncoder().encode(raw);
}

export function getAdminCookieName(): typeof COOKIE_NAME {
  return COOKIE_NAME;
}

export async function createAdminSessionToken(): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function validateAdminCredentials(
  username: string,
  password: string,
): boolean {
  const u = process.env.ADMIN_USERNAME ?? "kuka";
  if (process.env.NODE_ENV === "production") {
    const p = process.env.ADMIN_PASSWORD;
    if (!p) return false;
    return username === u && password === p;
  }
  const p = process.env.ADMIN_PASSWORD ?? "kuka-admin";
  return username === u && password === p;
}
