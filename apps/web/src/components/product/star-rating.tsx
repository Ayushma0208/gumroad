"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  size = "sm",
  className,
  interactive = false,
  onChange,
  name = "rating",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  interactive?: boolean;
  onChange?: (value: number) => void;
  name?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const dim = size === "lg" ? "size-7" : size === "md" ? "size-4" : "size-3.5";
  const display = hover ?? value;
  const label = `${value} out of 5 stars`;

  if (!interactive) {
    return (
      <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={label}>
        {Array.from({ length: 5 }).map((_, index) => {
          const filled = index + 1 <= Math.round(value);
          return (
            <Star
              key={index}
              className={cn(dim, filled ? "fill-current text-foreground" : "text-border")}
              aria-hidden
            />
          );
        })}
      </span>
    );
  }

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const star = index + 1;
        const filled = star <= display;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            name={name}
            className={cn(
              "rounded-md p-1 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              filled ? "text-foreground" : "text-border",
            )}
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onClick={() => onChange?.(star)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                onChange?.(Math.min(5, (value || 0) + 1));
              }
              if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                onChange?.(Math.max(1, (value || 1) - 1));
              }
            }}
          >
            <Star className={cn(dim, filled && "fill-current")} />
          </button>
        );
      })}
    </div>
  );
}
