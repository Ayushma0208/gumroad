import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product, ProductCardLayout } from "@/types/catalog";

function CreatorRow({
  product,
  light = false,
  compact = false,
}: {
  product: Product;
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-muted",
          compact ? "size-5" : "size-6",
        )}
      >
        <Image
          src={product.creator.avatarUrl}
          alt=""
          fill
          sizes="24px"
          className="object-cover"
        />
      </span>
      <span
        className={cn(
          "min-w-0 truncate text-sm",
          light ? "text-white/80" : "text-muted-foreground",
        )}
      >
        {product.creator.name}
      </span>
    </div>
  );
}

function RatingMeta({
  product,
  light = false,
}: {
  product: Product;
  light?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs tabular-nums",
        light ? "text-white/75" : "text-muted-foreground",
      )}
    >
      <Star
        className={cn(
          "size-3 fill-current",
          light ? "text-white" : "text-foreground/70",
        )}
      />
      {product.rating.toFixed(1)}
      <span className={light ? "text-white/55" : "text-muted-foreground/80"}>
        ({formatCompactNumber(product.reviewCount)})
      </span>
    </span>
  );
}

export function ProductCard({
  product,
  className,
  priority = false,
  layout = "default",
}: {
  product: Product;
  className?: string;
  priority?: boolean;
  layout?: ProductCardLayout;
}) {
  if (layout === "featured") {
    return (
      <article className={cn("group h-full", className)}>
        <Link
          href={`/products/${product.slug}`}
          className="relative flex h-full min-h-[22rem] flex-col overflow-hidden rounded-2xl sm:min-h-[28rem]"
        >
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-black/10" />
          <div className="relative mt-auto p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3 text-[11px] font-medium tracking-[0.14em] text-white/75 uppercase">
              <span>{product.categoryLabel}</span>
              <span className="font-mono tracking-normal text-white">
                {formatPrice(product.priceCents, product.currency)}
              </span>
            </div>
            <h3 className="mt-3 font-display text-3xl tracking-tight text-balance text-white sm:text-4xl">
              {product.title}
            </h3>
            <p className="mt-2 line-clamp-2 max-w-lg text-sm text-white/75">
              {product.subtitle}
            </p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <CreatorRow product={product} light />
              <RatingMeta product={product} light />
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (layout === "compact") {
    return (
      <article className={cn("group min-w-0", className)}>
        <Link
          href={`/products/${product.slug}`}
          className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="144px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {product.categoryLabel}
            </p>
            <h3 className="mt-1 text-[0.95rem] font-medium tracking-tight text-balance transition-colors group-hover:text-brand">
              {product.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <CreatorRow product={product} compact />
              <span className="font-mono text-sm">
                {formatPrice(product.priceCents, product.currency)}
              </span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className={cn("group h-full", className)}>
      <Link href={`/products/${product.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-80" />
          <span className="absolute top-3 left-3 rounded-full bg-background/92 px-2.5 py-1 text-[11px] font-medium tracking-wide text-foreground">
            {product.categoryLabel}
          </span>
          <span className="absolute right-3 bottom-3 font-mono text-sm text-white">
            {formatPrice(product.priceCents, product.currency)}
          </span>
        </div>
        <div className="flex flex-1 flex-col pt-4">
          <h3 className="text-[1.05rem] font-medium tracking-tight text-balance transition-colors group-hover:text-brand">
            {product.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {product.subtitle}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <CreatorRow product={product} />
            <RatingMeta product={product} />
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ProductCardSkeleton({
  layout = "default",
}: {
  layout?: ProductCardLayout;
}) {
  if (layout === "featured") {
    return <Skeleton className="min-h-[22rem] rounded-2xl sm:min-h-[28rem]" />;
  }

  if (layout === "compact") {
    return (
      <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-center gap-4">
        <Skeleton className="aspect-[4/3] rounded-xl" />
        <div>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-5 w-40" />
          <Skeleton className="mt-3 h-4 w-28" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Skeleton className="aspect-[4/5] rounded-xl" />
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-full" />
      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
