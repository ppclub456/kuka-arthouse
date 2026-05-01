import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminCookieName, verifyAdminToken } from "@/lib/admin-auth";

/** Returns JSON 401 if not signed in as admin; otherwise null. */
export async function requireAdminOr401(): Promise<NextResponse | null> {
  const jar = await cookies();
  const token = jar.get(getAdminCookieName())?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
