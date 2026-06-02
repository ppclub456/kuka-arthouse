import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Make a payment",
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Match admin's readable light theme for customers.
  return <div className="admin-app-scope min-h-full flex-1">{children}</div>;
}
