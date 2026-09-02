import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "md" ? "size-4" : "size-3.5";

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index + 1 <= Math.round(value);
        return (
          <Star
            key={index}
            className={cn(
              dim,
              filled ? "fill-current text-foreground" : "text-border",
            )}
          />
        );
      })}
    </span>
  );
}
