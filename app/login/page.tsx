import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to your Kuka Arthouse account. Guest checkout is always available.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <LoginForm />
    </div>
  );
}
