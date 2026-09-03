import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Operators"
        title="Admin"
        description="Moderation, payouts, and catalog tools will live here once the Express admin module is connected."
      />
      <div className="mt-8 rounded-xl border border-dashed border-border bg-card/40">
        <EmptyState
          full={false}
          icon={Shield}
          title="Tools are not wired yet"
          description="This space is reserved for operators. Nothing to moderate until live listings and payouts exist."
        />
      </div>
    </Container>
  );
}
