import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSwitchLink } from "@/components/auth/auth-switch-link";
import { RedirectIfAuthed } from "@/components/auth/redirect-if-authed";
import { AuthScreenSkeleton } from "@/components/auth/auth-screen-skeleton";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <AuthShell
      kicker="Get started"
      title="Create your account."
      description="Everyone starts as a customer. Open a store whenever you are ready to sell."
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Suspense fallback="Sign in">
            <AuthSwitchLink to="login">Sign in</AuthSwitchLink>
          </Suspense>
        </p>
      }
    >
      <Suspense fallback={<AuthScreenSkeleton />}>
        <RedirectIfAuthed>
          <SignupForm />
        </RedirectIfAuthed>
      </Suspense>
    </AuthShell>
  );
}
