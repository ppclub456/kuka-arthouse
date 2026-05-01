import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

function LoginFallback() {
  return (
    <div className="mx-auto max-w-md animate-pulse rounded-sm border border-[var(--border)] p-8">
      <div className="h-6 w-40 rounded bg-[var(--surface-elevated)]" />
      <div className="mt-8 h-10 w-full rounded bg-[var(--surface-elevated)]" />
      <div className="mt-4 h-10 w-full rounded bg-[var(--surface-elevated)]" />
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6 sm:py-20">
      <Suspense fallback={<LoginFallback />}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
