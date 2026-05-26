/** 1 NZD = rate AUD (ECB via Frankfurter, updated on business days). */
export type NzdAudRate = {
  rate: number;
  /** Rate date from provider (YYYY-MM-DD). */
  date: string;
};

let cached: (NzdAudRate & { cacheDay: string }) | null = null;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

type FrankfurterLatest = {
  amount?: number;
  base?: string;
  date?: string;
  rates?: { AUD?: number };
};

/** Fetches NZD→AUD; caches in-process for the current UTC calendar day. */
export async function getNzdAudRate(): Promise<NzdAudRate> {
  const day = todayUtc();
  if (cached && cached.cacheDay === day) {
    return { rate: cached.rate, date: cached.date };
  }

  const res = await fetch("https://api.frankfurter.app/latest?from=NZD&to=AUD", {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`FX provider returned ${res.status}`);
  }

  const data = (await res.json()) as FrankfurterLatest;
  const rate = data.rates?.AUD;
  const date = typeof data.date === "string" ? data.date : day;

  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("FX provider returned an invalid NZD/AUD rate.");
  }

  cached = { rate, date, cacheDay: day };
  return { rate, date };
}

export function convertNzdToAud(nzd: number, rate: number): number {
  if (!Number.isFinite(nzd) || !Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round(nzd * rate * 100) / 100;
}
