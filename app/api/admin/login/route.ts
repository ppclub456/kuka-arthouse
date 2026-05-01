import { NextResponse } from "next/server";
import {
  createAdminSessionToken,
  getAdminCookieName,
  validateAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = (await request.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");

  if (!validateAdminCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  let token: string;
  try {
    token = await createAdminSessionToken();
  } catch {
    console.error(
      "[api/admin/login] ADMIN_SESSION_SECRET missing or too short in production?",
    );
    return NextResponse.json(
      {
        error:
          "Server misconfigured: set ADMIN_SESSION_SECRET (min 16 characters) on your host and redeploy.",
      },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(getAdminCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
