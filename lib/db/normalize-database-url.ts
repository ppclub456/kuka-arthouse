/**
 * Vercel/Neon snips sometimes paste "POSTGRES_URL=postgresql://…" into DATABASE_URL by mistake.
 * Accept that and coerce to a real Postgres URL string.
 */
export function normalizeDatabaseUrl(raw: string | undefined): string {
  let u = raw?.trim() ?? "";
  const at = u.indexOf("postgresql://");
  const atPg = u.indexOf("postgres://");
  const cut =
    at !== -1 ? at : atPg !== -1 ? atPg : -1;
  if (cut !== -1) u = u.slice(cut).trim();

  try {
    if (new URL(u).protocol.startsWith("postgres")) return u;
  } catch {
    // fall through
  }
  return u;
}
