"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AccountPreferencesExperience() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl tracking-tight">Preferences</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Appearance is stored on this device. Notification email preferences live under
        Notifications.
      </p>

      <section className="mt-8">
        <h2 className="text-base font-medium">Appearance</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ] as const
          ).map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={theme === option.value ? "default" : "outline"}
              className="rounded-lg"
              aria-pressed={theme === option.value}
              onClick={() => setTheme(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-base font-medium">Email notifications</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage purchase, sales, review, and marketing email toggles.
        </p>
        <Link
          href="/account/notifications"
          className="mt-3 inline-flex text-sm font-medium hover:underline"
        >
          Open notification preferences
        </Link>
      </section>
    </div>
  );
}
