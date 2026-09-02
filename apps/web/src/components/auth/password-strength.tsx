"use client";

import { cn } from "@/lib/utils";

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "A letter", ok: /[A-Za-z]/.test(password) },
    { label: "A number", ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((check) => check.ok).length;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index < score ? "bg-foreground" : "bg-muted",
            )}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {checks.map((check) => (
          <li
            key={check.label}
            className={cn(check.ok && "text-foreground")}
          >
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
