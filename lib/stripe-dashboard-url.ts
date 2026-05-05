/** Builds Stripe Dashboard URLs using publishable key mode (test vs live). */
export function stripeDashboardCustomersPath(): string {
  const pk = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "").toLowerCase();
  const test =
    pk.includes("test") ||
    (process.env.STRIPE_SECRET_KEY ?? "").toLowerCase().includes("_test");
  return test ? "/test/customers" : "/customers";
}

export function stripeDashboardCustomerUrl(customerId: string): string {
  const base = "https://dashboard.stripe.com";
  return `${base}${stripeDashboardCustomersPath()}/${encodeURIComponent(customerId)}`;
}
