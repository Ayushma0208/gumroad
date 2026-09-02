import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <Container className="flex min-h-[70vh] items-center py-16">
      <div className="mx-auto w-full max-w-md">
        <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
          Account
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">Welcome back</h1>
        <p className="mt-3 text-muted-foreground">
          Sign in with the email you used to create a customer or seller account.
        </p>
        <LoginForm />
        <p className="mt-6 text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="text-foreground underline-offset-4 hover:underline">
            Create a customer account
          </Link>
          {" · "}
          <Link
            href="/signup?as=creator"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Create a seller account
          </Link>
        </p>
      </div>
    </Container>
  );
}
