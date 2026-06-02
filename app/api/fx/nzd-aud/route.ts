import { NextResponse } from "next/server";
import { getNzdAudRate } from "@/lib/fx/nzd-aud";

export const dynamic = "force-dynamic";

/** Public NZD→AUD mid-market rate (Google Finance) for storefront payment page. */
export async function GET() {
  try {
    const { rate, date } = await getNzdAudRate();
    return NextResponse.json({
      rate,
      date,
      pair: "NZD/AUD",
      source: "google.com",
    });
  } catch (e) {
    console.error("[api/fx/nzd-aud] GET", e);
    const message =
      e instanceof Error
        ? e.message
        : "Could not load today’s NZD→AUD rate. Try again in a moment.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
