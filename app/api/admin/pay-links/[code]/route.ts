import { NextResponse } from "next/server";
import { deleteOpenPayLink } from "@/lib/db/pay-link-repo";
import { getOrdersDb } from "@/lib/db/client";
import { requireAdminOr401 } from "@/lib/require-admin-session";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  ctx: { params?: Promise<Record<string, string | string[] | undefined>> },
) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  const p = (await ctx.params) ?? {};
  const raw = p.code;
  const codeSegment = Array.isArray(raw) ? raw[0] : raw;
  if (typeof codeSegment !== "string" || !codeSegment.trim()) {
    return NextResponse.json({ error: "Missing code." }, { status: 400 });
  }

  if (!getOrdersDb()) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  const outcome = await deleteOpenPayLink(codeSegment);
  if (outcome === "no_db") {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }
  if (outcome === "not_found") {
    return NextResponse.json({ error: "Pay link code not found." }, { status: 404 });
  }
  if (outcome === "not_open") {
    return NextResponse.json(
      {
        error:
          "Only open links can be deleted (must be unpaid and not yet expired). Paid or expired rows are kept.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
