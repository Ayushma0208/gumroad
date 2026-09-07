import { Container } from "@/components/layout/container";
import { ProductCardSkeleton } from "@/components/product/product-card";
import { Skeleton } from "@/components/ui/skeleton";

export function CreatorStoreSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading storefront</span>
      <Skeleton className="h-48 w-full rounded-none sm:h-56 lg:h-72" />
      <Container className="-mt-12 sm:-mt-16">
        <div className="flex flex-col items-center sm:flex-row sm:items-end sm:gap-8">
          <Skeleton className="size-24 rounded-full sm:size-28" />
          <div className="mt-5 w-full max-w-xl sm:mt-0">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-3 h-10 w-64" />
            <Skeleton className="mt-3 h-4 w-28" />
            <Skeleton className="mt-4 h-16 w-full" />
          </div>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </Container>
    </div>
  );
}
