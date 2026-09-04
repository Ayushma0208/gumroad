"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DiscoverError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-16 text-center sm:py-24">
      <div className="mb-5 flex size-12 items-center justify-center rounded-xl border border-border bg-muted/60">
        <WifiOff className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="font-display text-3xl tracking-tight sm:text-4xl">
        The catalog didn’t load
      </p>
      <p className="mt-3 max-w-md text-muted-foreground">
        {message ??
          "The marketplace API didn’t respond. Check that the API is running, then try again."}
      </p>
      <Button className="mt-8 h-11 rounded-xl px-5" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
