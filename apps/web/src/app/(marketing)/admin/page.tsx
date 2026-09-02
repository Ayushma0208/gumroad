import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <Container className="py-12 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Operators
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Admin</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Moderation, payouts, and catalog tools will live here once the Express
        admin module is connected.
      </p>
    </Container>
  );
}
