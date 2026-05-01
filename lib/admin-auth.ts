import { jwtVerify, SignJWT } from "jose";

const COOKIE_NAME = "kuka_admin_session";

/** JWT roles accepted for /admin (legacy `admin` + new `super_admin`) */
export const ADMIN_SESSION_ROLES = ["super_admin", "admin"] as const;

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
  return new SignJWT({ role: "super_admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

function isAllowedRole(role: unknown): boolean {
  return (
    typeof role === "string" &&
    (ADMIN_SESSION_ROLES as readonly string[]).includes(role)
  );
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return isAllowedRole(payload.role);
  } catch {
    return false;
  }
}

/** Trim pasted Vercel values (newline / spaces from copy‑paste breaks login). */
function envCredential(value: string | undefined): string {
  return (value ?? "").trim();
}

function envMatch(
  username: string,
  password: string,
  envUser: string | undefined,
  envPass: string | undefined,
): boolean {
  const u = envCredential(envUser);
  const p = envCredential(envPass);
  return Boolean(u && p) && username === u && password === p;
}

/**
 * Production: SUPER_ADMIN_* and/or ADMIN_* must both be non-empty on the pair you use.
 * Development: SUPER_ADMIN defaults amituofo / amituofo123!; ADMIN defaults kuka / kuka-admin.
 */
export function validateAdminCredentials(
  username: string,
  password: string,
): boolean {
  if (process.env.NODE_ENV === "production") {
    if (
      envMatch(username, password, process.env.SUPER_ADMIN_USERNAME, process.env.SUPER_ADMIN_PASSWORD)
    ) {
      return true;
    }
    if (
      envMatch(username, password, process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)
    ) {
      return true;
    }
    return false;
  }

  const superOk = envMatch(
    username,
    password,
    process.env.SUPER_ADMIN_USERNAME ?? "amituofo",
    process.env.SUPER_ADMIN_PASSWORD ?? "amituofo123!",
  );
  const adminOk = envMatch(
    username,
    password,
    process.env.ADMIN_USERNAME ?? "kuka",
    process.env.ADMIN_PASSWORD ?? "kuka-admin",
  );
  return superOk || adminOk;
}
