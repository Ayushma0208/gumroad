import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <h1 className="font-display text-4xl tracking-tight">Analytics</h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        Revenue and traffic charts will use Recharts once live order data exists.
      </p>
    </Container>
  );
}
