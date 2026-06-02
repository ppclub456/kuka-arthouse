import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Make a payment",
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
