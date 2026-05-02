import { NextResponse } from "next/server";
import {
  resolveAdminStripeQuote,
  type AdminQuotePayload,
} from "@/lib/admin-quote";
import { appBaseUrl } from "@/lib/checkout-base-url";
import { requireAdminOr401 } from "@/lib/require-admin-session";
import { signPayLinkCompact } from "@/lib/payment-link-compact";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdminOr401();
  if (denied) return denied;

  let body: AdminQuotePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const q = resolveAdminStripeQuote(body);
    if (q.lineTotalAud < 0.5) {
      return NextResponse.json(
        { error: "Amount must be at least A$0.50." },
        { status: 400 },
      );
    }

    const compact = signPayLinkCompact({
      amountAud: q.lineTotalAud,
      title: q.title,
      mode: q.mode,
      productId: q.productId,
      reference: q.paymentReference,
    });

    const base = appBaseUrl(request.headers);
    const qs = encodeURIComponent(compact);
    const url = `${base}/pay?p=${qs}`;

    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create link";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
