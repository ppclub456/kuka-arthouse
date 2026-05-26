/** 1 NZD = rate AUD (Google Finance mid-market, scraped from quote page). */
export type NzdAudRate = {
  rate: number;
  /** Quote date from Google (YYYY-MM-DD, UTC). */
  date: string;
};

let cached: (NzdAudRate & { cacheDay: string }) | null = null;

const GOOGLE_FINANCE_PAIR = "NZD-AUD";
const GOOGLE_FINANCE_URL = `https://www.google.com/finance/quote/${GOOGLE_FINANCE_PAIR}?hl=en`;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function timestampToDate(tsSec: number): string {
  return new Date(tsSec * 1000).toISOString().slice(0, 10);
}

/** Parses mid-market rate embedded in Google Finance quote HTML. */
export function parseGoogleFinanceNzdAud(html: string): { rate: number; date: string } {
  const label = "NZD / AUD";
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(
    new RegExp(`"${escaped}",\\d+,null,\\[([0-9.]+)[^\\]]*\\][^\\[]*\\[(\\d{10})\\]`),
  );

  if (!match) {
    throw new Error("Could not parse NZD/AUD rate from Google Finance.");
  }

  const rate = Number.parseFloat(match[1]);
  const ts = Number.parseInt(match[2], 10);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Google Finance returned an invalid NZD/AUD rate.");
  }

  const date = Number.isFinite(ts) && ts > 0 ? timestampToDate(ts) : todayUtc();
  return { rate, date };
}

/** Fetches NZD→AUD from Google Finance; caches in-process for the current UTC calendar day. */
export async function getNzdAudRate(): Promise<NzdAudRate> {
  const day = todayUtc();
  if (cached && cached.cacheDay === day) {
    return { rate: cached.rate, date: cached.date };
  }

  const res = await fetch(GOOGLE_FINANCE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Google Finance returned ${res.status}`);
  }

  const html = await res.text();
  const { rate, date } = parseGoogleFinanceNzdAud(html);

  cached = { rate, date, cacheDay: day };
  return { rate, date };
}

export function convertNzdToAud(nzd: number, rate: number): number {
  if (!Number.isFinite(nzd) || !Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round(nzd * rate * 100) / 100;
}
