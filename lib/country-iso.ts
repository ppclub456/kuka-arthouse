/** ISO 3166-1 alpha-2 for Stripe billing / Elements */
export function countryLabelToIso(label: string): string {
  const map: Record<string, string> = {
    Australia: "AU",
    "New Zealand": "NZ",
    "United States": "US",
    "United Kingdom": "GB",
    Canada: "CA",
    Germany: "DE",
    France: "FR",
    Japan: "JP",
    China: "CN",
    India: "IN",
    Brazil: "BR",
    Mexico: "MX",
    Netherlands: "NL",
    Italy: "IT",
    Spain: "ES",
    Other: "AU",
  };
  return map[label] ?? "AU";
}
