import Stripe from "stripe";

let cached: Stripe | null = null;

export function stripeAvailable(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key);
  }
  return cached;
}
