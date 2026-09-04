"use client";

import { WifiOff } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";

export default function ProductError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <EmptyState
        icon={WifiOff}
        title="Couldn’t load this product"
        description="The marketplace API didn’t return this listing. Try again in a moment, or go back to Discover."
        actionHref="/discover"
        actionLabel="Back to Discover"
      />
      <div className="-mt-10 mb-16 flex justify-center">
        <Button variant="ghost" className="rounded-xl" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
