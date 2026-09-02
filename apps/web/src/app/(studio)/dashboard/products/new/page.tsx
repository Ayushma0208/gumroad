import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Create product",
};

export default function NewProductPage() {
  return (
    <Container className="py-12 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        New product
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        A five-step publish flow is next.
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Your seller account is ready. Product type, details, files, pricing, and
        review will land here as a guided experience — not a single long form.
      </p>
    </Container>
  );
}
