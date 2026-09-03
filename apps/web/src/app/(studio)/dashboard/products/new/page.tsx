import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Create product",
};

const steps = [
  {
    title: "Type",
    body: "Choose a digital download, course, or membership.",
  },
  {
    title: "Details",
    body: "Title, cover, and the pitch buyers read first.",
  },
  {
    title: "Files",
    body: "Upload what they receive after payment.",
  },
  {
    title: "Pricing",
    body: "Set a price — or let people pay what they want.",
  },
  {
    title: "Review",
    body: "Preview the listing, then publish to Discover.",
  },
];

export default function NewProductPage() {
  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="New product"
        title="A five-step publish flow is next."
        description="Your seller account is ready. Product type, details, files, pricing, and review will land here as a guided experience — not a single long form."
        actions={
          <Link
            href="/dashboard/products"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl")}
          >
            Back to products
          </Link>
        }
      />

      <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Card className="h-full py-0">
              <CardHeader className="pt-5">
                <p className="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <CardTitle className="mt-3">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="size-4 text-brand" />
        Store profile is set. This flow will save drafts automatically.
      </p>
    </Container>
  );
}
