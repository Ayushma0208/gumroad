import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      kicker="Account"
      title="Reset your password."
      description="Enter the email on the account. We’ll send a reset link once mail is connected to the API."
      footer={
        <p className="text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link
            href="/login"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
