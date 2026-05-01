/** Public site origin for Stripe success/cancel redirects. */
export function appBaseUrl(headers: Headers): string {
  const fallback = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fallback) return fallback.replace(/\/$/, "");

  let hostHeader =
    headers.get("x-forwarded-host")?.trim() ??
    headers.get("host")?.trim() ??
    "";

  const vercelHost = process.env.VERCEL_URL?.trim();

  let origin: string;

  if (hostHeader.includes(",")) {
    hostHeader = hostHeader.split(",")[0].trim();
  }

  const protoHeader = headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  if (hostHeader) {
    const scheme =
      protoHeader === "https" || protoHeader === "http"
        ? protoHeader
        : process.env.NODE_ENV === "production"
          ? "https"
          : "http";
    origin = `${scheme}://${hostHeader}`;
  } else if (vercelHost) {
    const h = vercelHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
    origin = `https://${h}`;
  } else {
    origin = "http://localhost:3000";
  }

  return origin.replace(/\/$/, "");
}
