"use client";

import { cn } from "@/lib/utils";
import type { DateRangeKey } from "@/types/studio";
import { rangeCopy } from "@/lib/studio/copy";

const ranges: DateRangeKey[] = ["daily", "weekly", "monthly", "yearly"];

export function DateRangeTabs({
  value,
  onChange,
}: {
  value: DateRangeKey;
  onChange: (next: DateRangeKey) => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg bg-muted p-0.5"
      role="tablist"
      aria-label="Date range"
    >
      {ranges.map((range) => {
        const active = range === value;
        return (
          <button
            key={range}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(range)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {rangeCopy[range]}
          </button>
        );
      })}
    </div>
  );
}
