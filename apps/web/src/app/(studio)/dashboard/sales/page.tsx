import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Sales",
};

export default function SalesPage() {
  return (
    <Container className="py-12 sm:py-16">
      <h1 className="font-display text-4xl tracking-tight">Sales</h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        Orders will appear here after checkout and Razorpay are connected.
      </p>
    </Container>
  );
}
