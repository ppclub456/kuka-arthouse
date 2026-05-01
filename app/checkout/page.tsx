import { CheckoutForm } from "@/components/checkout-form";

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
        Checkout
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Guest checkout — no account required. Review your order, add an optional
        tip, then continue to payment.
      </p>
      <div className="mt-10">
        <CheckoutForm />
      </div>
    </div>
  );
}
