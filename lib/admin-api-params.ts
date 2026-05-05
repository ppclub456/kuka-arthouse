/**
 * Next.js app route handlers pass `context.params` as an optional Promise; `id` may be a string or string[].
 */
export async function parseRouteIdParam(
  ctx: { params?: Promise<Record<string, string | string[] | undefined>> },
  key = "id",
): Promise<number | null> {
  const p = (await ctx.params) ?? {};
  const raw = p[key];
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (typeof s !== "string" || !s.trim()) return null;
  const n = Number.parseInt(s.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function isPgUndefinedColumnError(e: unknown): boolean {
  let cur: unknown = e;
  for (let i = 0; i < 6 && cur && typeof cur === "object"; i++) {
    const code = (cur as { code?: unknown }).code;
    if (code === "42703") return true;
    cur = "cause" in cur ? (cur as { cause: unknown }).cause : null;
  }
  return false;
}
