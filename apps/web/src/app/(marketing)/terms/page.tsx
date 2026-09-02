import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <Container className="max-w-2xl py-16 sm:py-24">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Legal
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Terms</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">
        Lumen is a marketplace for digital products. By creating an account you
        agree to use it honestly — no stolen work, no fake reviews, no attempts
        to circumvent fees. A full legal draft will replace this page before
        public launch.
      </p>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        You start as a customer. Opening a store is optional, and you can keep
        buying after you start selling.
      </p>
      <Link
        href="/signup"
        className="mt-8 inline-block text-sm text-foreground underline-offset-4 hover:underline"
      >
        Back to signup
      </Link>
    </Container>
  );
}
