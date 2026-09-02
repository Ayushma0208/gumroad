import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductDetailSkeleton() {
  return (
    <Container className="pt-8 pb-20 sm:pt-12">
      <Skeleton className="h-3 w-40" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:gap-16">
        <div>
          <Skeleton className="aspect-[4/5] rounded-2xl" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="size-16 rounded-lg" />
            <Skeleton className="size-16 rounded-lg" />
            <Skeleton className="size-16 rounded-lg" />
          </div>
        </div>
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-12 w-full" />
          <Skeleton className="mt-3 h-12 w-4/5" />
          <Skeleton className="mt-5 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-2/3" />
          <div className="mt-6 flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-44" />
            </div>
          </div>
          <Skeleton className="mt-8 h-48 rounded-2xl" />
        </div>
      </div>
      <div className="mt-20 max-w-2xl space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </Container>
  );
}
