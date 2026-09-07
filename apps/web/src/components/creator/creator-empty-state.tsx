import { Store } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";

export function CreatorEmptyState() {
  return (
    <EmptyState
      icon={Store}
      title="This store is getting ready."
      description="No products have been published yet."
      actionHref="/discover"
      actionLabel="Explore Marketplace"
    />
  );
}

export function CreatorNotFoundState() {
  return (
    <EmptyState
      icon={Store}
      title="Creator not found"
      description="This storefront doesn't exist or is no longer available."
      actionHref="/discover"
      actionLabel="Explore products"
    />
  );
}
