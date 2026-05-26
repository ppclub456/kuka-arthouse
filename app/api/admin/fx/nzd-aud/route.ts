import { NextResponse } from "next/server";
import { getNzdAudRate } from "@/lib/fx/nzd-aud";
import { requireAdminOr401 } from "@/lib/require-admin-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  try {
    const { rate, date } = await getNzdAudRate();
    return NextResponse.json({
      rate,
      date,
      pair: "NZD/AUD",
      source: "google.com",
    });
  } catch (e) {
    console.error("[api/admin/fx/nzd-aud] GET", e);
    const message =
      e instanceof Error
        ? e.message
        : "Could not load today’s NZD→AUD rate. Try again in a moment.";
    const status = 502;
    return NextResponse.json({ error: message }, { status });
  }
}
