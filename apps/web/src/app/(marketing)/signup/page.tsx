import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SignupForm } from "@/components/auth/signup-form";
import type { SignupValues } from "@/lib/auth/schema";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const { as } = await searchParams;
  const initialRole: SignupValues["role"] =
    as === "creator" ? "CREATOR" : "CUSTOMER";

  return (
    <Container className="flex min-h-[70vh] items-center py-16">
      <div className="mx-auto w-full max-w-lg">
        <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
          Get started
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">
          {initialRole === "CREATOR" ? "Open a seller account" : "Create your account"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {initialRole === "CREATOR"
            ? "Choose I want to sell, then publish products from your dashboard."
            : "Shop the marketplace, or switch to I want to sell to open a store."}
        </p>
        <SignupForm initialRole={initialRole} />
        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </Container>
  );
}
