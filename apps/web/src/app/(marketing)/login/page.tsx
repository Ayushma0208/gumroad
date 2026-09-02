import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSwitchLink } from "@/components/auth/auth-switch-link";
import { RedirectIfAuthed } from "@/components/auth/redirect-if-authed";
import { AuthScreenSkeleton } from "@/components/auth/auth-screen-skeleton";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <AuthShell
      kicker="Account"
      title="Welcome back."
      description="Sign in to your library, orders, and — if you sell — your store."
      footer={
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Suspense fallback="Create an account">
            <AuthSwitchLink to="signup">Create an account</AuthSwitchLink>
          </Suspense>
        </p>
      }
    >
      <Suspense fallback={<AuthScreenSkeleton />}>
        <RedirectIfAuthed>
          <LoginForm />
        </RedirectIfAuthed>
      </Suspense>
    </AuthShell>
  );
}
