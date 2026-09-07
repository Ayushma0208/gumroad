"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ANALYTICS_RANGE_OPTIONS, toInputDate } from "@/lib/analytics/format";
import { cn } from "@/lib/utils";
import type { AnalyticsRangeKey, AnalyticsRangeParams } from "@/types/analytics";

function defaultCustomBounds() {
  const today = toInputDate(new Date());
  const fromDate = new Date();
  fromDate.setUTCDate(fromDate.getUTCDate() - 30);
  return { from: toInputDate(fromDate), to: today };
}

export function AnalyticsRangeControl({
  value,
  onChange,
}: {
  value: AnalyticsRangeParams;
  onChange: (next: AnalyticsRangeParams) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(() => value.from ?? "");
  const [draftTo, setDraftTo] = useState(() => value.to ?? "");

  const label =
    ANALYTICS_RANGE_OPTIONS.find((option) => option.value === value.range)?.label ??
    "Range";

  function select(range: AnalyticsRangeKey) {
    if (range === "custom") {
      const bounds = defaultCustomBounds();
      const from = value.from || draftFrom || bounds.from;
      const to = value.to || draftTo || bounds.to;
      setDraftFrom(from);
      setDraftTo(to);
      onChange({ range: "custom", from, to });
      setOpen(true);
      return;
    }
    onChange({ range });
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-lg"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {value.range === "custom" && value.from && value.to
          ? `${value.from} → ${value.to}`
          : label}
      </Button>

      {open ? (
        <div
          className={cn(
            "absolute right-0 z-20 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-border bg-background p-3 shadow-lg",
            "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:mt-0 max-sm:rounded-t-2xl max-sm:rounded-b-none",
          )}
          role="dialog"
          aria-label="Select date range"
        >
          <ul className="grid gap-1">
            {ANALYTICS_RANGE_OPTIONS.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    value.range === option.value
                      ? "bg-muted font-medium"
                      : "hover:bg-muted/60",
                  )}
                  onClick={() => select(option.value)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>

          {value.range === "custom" ? (
            <div className="mt-3 grid gap-2 border-t border-border pt-3">
              <label className="grid gap-1 text-xs text-muted-foreground">
                From
                <Input
                  type="date"
                  value={draftFrom}
                  max={draftTo || undefined}
                  onChange={(event) => setDraftFrom(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                To
                <Input
                  type="date"
                  value={draftTo}
                  min={draftFrom || undefined}
                  onChange={(event) => setDraftTo(event.target.value)}
                />
              </label>
              <Button
                type="button"
                size="sm"
                className="mt-1"
                disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                onClick={() => {
                  onChange({ range: "custom", from: draftFrom, to: draftTo });
                  setOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full sm:hidden"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      ) : null}
    </div>
  );
}
