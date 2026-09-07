"use client";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/use-notifications";
import { useToastStore } from "@/stores/toast-store";
import type { NotificationPreferences } from "@/lib/api/notifications";

type ToggleKey = keyof Omit<
  NotificationPreferences,
  "securityEmails" | "updatedAt"
>;

const rows: Array<{
  key: ToggleKey;
  label: string;
  description: string;
  section: "transactional" | "marketing";
}> = [
  {
    key: "purchaseEmails",
    label: "Purchase confirmations",
    description: "Receipts and Library access after a successful payment.",
    section: "transactional",
  },
  {
    key: "creatorSaleEmails",
    label: "Creator sales",
    description: "Email when someone buys your product.",
    section: "transactional",
  },
  {
    key: "reviewEmails",
    label: "Review notifications",
    description: "Email when a customer reviews your product.",
    section: "transactional",
  },
  {
    key: "productModerationEmails",
    label: "Product moderation",
    description: "Email when an operator publishes, unpublishes, or archives a listing.",
    section: "transactional",
  },
  {
    key: "marketingEmailEnabled",
    label: "Product news & promotions",
    description: "Optional marketing. Off by default. Not used for campaigns yet.",
    section: "marketing",
  },
];

export function NotificationPreferencesExperience() {
  const query = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  const showToast = useToastStore((state) => state.show);
  const prefs = query.data;

  async function toggle(key: ToggleKey) {
    if (!prefs) return;
    try {
      await update.mutateAsync({ [key]: !prefs[key] });
      showToast({ title: "Preferences saved" });
    } catch {
      showToast({ title: "Couldn’t save preferences", description: "Try again." });
    }
  }

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Account"
        title="Notification preferences"
        description="Transactional emails keep purchases and sales working. Marketing is optional."
      />

      {query.isPending || !prefs ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading preferences…</p>
      ) : (
        <div className="mt-10 max-w-xl space-y-10">
          <section>
            <h2 className="text-base font-medium">Transactional</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Security and critical account notices stay on. Other categories can be muted.
            </p>
            <ul className="mt-4 divide-y divide-border border-t border-border">
              <li className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium">Security & account</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Always enabled for account safety.
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">Required</span>
              </li>
              {rows
                .filter((row) => row.section === "transactional")
                .map((row) => (
                  <PreferenceRow
                    key={row.key}
                    label={row.label}
                    description={row.description}
                    enabled={prefs[row.key]}
                    busy={update.isPending}
                    onToggle={() => void toggle(row.key)}
                  />
                ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium">Marketing</h2>
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {rows
                .filter((row) => row.section === "marketing")
                .map((row) => (
                  <PreferenceRow
                    key={row.key}
                    label={row.label}
                    description={row.description}
                    enabled={prefs[row.key]}
                    busy={update.isPending}
                    onToggle={() => void toggle(row.key)}
                  />
                ))}
            </ul>
          </section>
        </div>
      )}
    </Container>
  );
}

function PreferenceRow({
  label,
  description,
  enabled,
  busy,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant={enabled ? "default" : "outline"}
        disabled={busy}
        aria-pressed={enabled}
        onClick={onToggle}
      >
        {enabled ? "On" : "Off"}
      </Button>
    </li>
  );
}
