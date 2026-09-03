"use client";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardSettingsPage() {
  const { user } = useAuth();
  const store = user?.creatorProfile;

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Store"
        title="Settings"
        description="Payouts, notifications, and public store details will be editable here. For now this is a read-only snapshot of what you set up."
      />

      {store ? (
        <Card className="mt-8 max-w-xl">
          <CardHeader>
            <CardTitle>Public store</CardTitle>
            <CardDescription>
              How buyers see you on Lumen. Editing lands here next.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <Row label="Display name" value={store.displayName} />
              <Row label="Store name" value={store.storeName} />
              <Row label="URL" value={`lumen.app/${store.slug}`} mono />
              <Row label="Category" value={store.category} />
              <Row label="Bio" value={store.bio} />
            </dl>
          </CardContent>
        </Card>
      ) : (
        <p className="mt-10 text-sm text-muted-foreground">
          No store profile on this account yet.
        </p>
      )}
    </Container>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="border-b border-border pb-4 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "mt-1 font-mono text-xs" : "mt-1"}>{value}</dd>
    </div>
  );
}
