import { EmptyState } from "@/components/layout/empty-state";

export default function ProductNotFound() {
  return (
    <EmptyState
      title="This product is not on the shelf."
      description="The link may be old, or the creator unpublished it. Browse the marketplace and find something else worth owning."
      actionHref="/discover"
      actionLabel="Back to Discover"
    />
  );
}
