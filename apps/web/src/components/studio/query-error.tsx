"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudioQueryError({
  title = "Couldn’t load this page.",
  description = "The studio data didn’t arrive. Try again in a moment.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-muted/40 px-6 py-16 text-center">
      <AlertCircle className="size-5 text-muted-foreground" aria-hidden />
      <p className="mt-4 font-display text-2xl tracking-tight">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
