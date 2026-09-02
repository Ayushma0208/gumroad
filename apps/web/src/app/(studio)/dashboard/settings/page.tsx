"use client";

import { Container } from "@/components/layout/container";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardSettingsPage() {
  const { user } = useAuth();
  const store = user?.creatorProfile;

  return (
    <Container className="py-12 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Store
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Settings</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Payouts, notifications, and public store details will be editable here.
        For now this is a read-only snapshot of what you set up.
      </p>

      {store ? (
        <dl className="mt-10 max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6 text-sm">
          <Row label="Display name" value={store.displayName} />
          <Row label="Store name" value={store.storeName} />
          <Row label="URL" value={`lumen.app/${store.slug}`} />
          <Row label="Category" value={store.category} />
          <Row label="Bio" value={store.bio} />
        </dl>
      ) : (
        <p className="mt-10 text-sm text-muted-foreground">
          No store profile on this account yet.
        </p>
      )}
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border pb-4 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
