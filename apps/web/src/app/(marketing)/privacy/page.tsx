import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <Container className="max-w-2xl py-16 sm:py-24">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Legal
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Privacy</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">
        Sessions live in an HTTP-only cookie. We do not store access tokens in
        the browser. When the Express API is live, the same cookie contract
        will apply — nothing for you to copy, paste, or lose.
      </p>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        A complete privacy policy will replace this page before public launch.
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
