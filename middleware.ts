import { type NextRequest, NextResponse } from "next/server";
import { getAdminCookieName, verifyAdminToken } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/pay/")) {
    return NextResponse.next();
  }
  if (pathname === "/admin/login") {
    const existing = request.cookies.get(getAdminCookieName())?.value;
    if (existing && (await verifyAdminToken(existing))) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token || !(await verifyAdminToken(token))) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
