import { ProductCardSkeleton } from "@/components/product/product-card";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export function DiscoverSkeleton() {
  return (
    <div className="pb-20">
      <Container className="pt-10 sm:pt-16">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-12 w-full max-w-xl sm:h-16" />
        <Skeleton className="mt-4 h-5 w-72 max-w-full" />
        <Skeleton className="mt-8 h-14 w-full rounded-2xl sm:h-16" />
      </Container>

      <Container className="mt-14 sm:mt-20">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-8 w-56" />
        <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <ProductCardSkeleton layout="featured" />
          </div>
          <div className="flex flex-col justify-between gap-6 lg:col-span-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <ProductCardSkeleton key={index} layout="compact" />
            ))}
          </div>
        </div>
      </Container>

      <Container className="mt-12">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </Container>
    </div>
  );
}
