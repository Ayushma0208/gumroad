"use client";

import { BookOpen, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { ProductCardCartButton } from "@/components/product/product-card-cart-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnsProduct } from "@/hooks/use-library";
import { cloudinaryThumb } from "@/lib/cloudinary";
import { formatCompactNumber, formatPrice } from "@/lib/format";
import { creatorPath, productPath } from "@/lib/paths";
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
    <Link
      href={creatorPath(product.creator.slug)}
      className={cn(
        "relative z-10 flex min-w-0 items-center gap-2 rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        light ? "hover:text-white" : "hover:text-foreground",
      )}
    >
      <CreatorAvatar
        src={product.creator.avatarUrl}
        name={product.creator.name}
        size={compact ? "sm" : "sm"}
        className={compact ? "size-5" : "size-6"}
      />
      <span
        className={cn(
          "min-w-0 truncate text-sm",
          light ? "text-white/80" : "text-muted-foreground",
        )}
      >
        {product.creator.name}
      </span>
    </Link>
  );
}

function RatingMeta({
  product,
  light = false,
}: {
  product: Product;
  light?: boolean;
}) {
  if (!product.reviewCount) return null;
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

function CardBadges({ product }: { product: Product }) {
  const badges: string[] = [];
  if (product.editorsPick) badges.push("Editor’s pick");
  else if (product.featured) badges.push("Featured");
  if (product.trending) badges.push("Trending");
  if (badges.length === 0) return null;
  return (
    <span className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5">
      {badges.slice(0, 2).map((badge) => (
        <span
          key={badge}
          className="rounded-full bg-background/92 px-2 py-0.5 text-[10px] font-medium tracking-wide text-foreground"
        >
          {badge}
        </span>
      ))}
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
  const owned = useOwnsProduct(product.id);
  if (layout === "featured") {
    return (
      <article className={cn("group h-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-0.5", className)}>
        <div className="relative flex h-full min-h-[22rem] flex-col overflow-hidden rounded-2xl sm:min-h-[28rem]">
          <Link href={productPath(product.slug)} className="absolute inset-0">
            {product.imageUrl ? (
              <Image
                src={cloudinaryThumb(product.imageUrl, 1200)}
                alt={product.title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority={priority}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <span className="absolute inset-0 bg-muted" />
            )}
            <span className="sr-only">{product.title}</span>
          </Link>
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-black/10" />
          <div className="relative mt-auto p-5 sm:p-7">
            <Link href={productPath(product.slug)} className="block">
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
            </Link>
            <div className="mt-5 flex items-center justify-between gap-3">
              <CreatorRow product={product} light />
              <RatingMeta product={product} light />
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (layout === "compact") {
    return (
      <article className={cn("group min-w-0", className)}>
        <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
          <Link
            href={productPath(product.slug)}
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
          >
            {product.imageUrl ? (
              <Image
                src={cloudinaryThumb(product.imageUrl, 320)}
                alt={product.title}
                fill
                sizes="144px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              />
            ) : null}
          </Link>
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {product.categoryLabel}
            </p>
            <Link href={productPath(product.slug)}>
              <h3 className="mt-1 text-[0.95rem] font-medium tracking-tight text-balance transition-colors group-hover:text-brand">
                {product.title}
              </h3>
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <CreatorRow product={product} compact />
              <span className="font-mono text-sm">
                {formatPrice(product.priceCents, product.currency)}
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group h-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-0.5", className)}>
      <div className="flex h-full flex-col">
        <Link
          href={productPath(product.slug)}
          className="relative aspect-[4/5] overflow-hidden rounded-xl border border-transparent bg-muted transition-colors duration-200 group-hover:border-border"
        >
          {product.imageUrl ? (
            <Image
              src={cloudinaryThumb(product.imageUrl, 720)}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
            />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-80" />
          <span className="absolute top-3 left-3 rounded-full bg-background/92 px-2.5 py-1 text-[11px] font-medium tracking-wide text-foreground">
            {product.categoryLabel}
          </span>
          <CardBadges product={product} />
          <span className="absolute right-3 bottom-3 font-mono text-sm text-white">
            {formatPrice(product.priceCents, product.currency)}
          </span>
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            {owned ? (
              <Link
                href={`/library/${product.id}`}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-background/90 px-3 text-xs font-medium text-foreground shadow-sm backdrop-blur-md"
                aria-label="Open in library"
              >
                <BookOpen className="size-3.5" />
                Owned
              </Link>
            ) : (
              <>
                <WishlistButton productId={product.id} />
                <ProductCardCartButton
                  product={product}
                  className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                />
              </>
            )}
          </div>
        </Link>
        <div className="flex flex-1 flex-col pt-4">
          <Link href={productPath(product.slug)}>
            <h3 className="text-[1.05rem] font-medium tracking-tight text-balance transition-colors group-hover:text-brand">
              {product.title}
            </h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {product.subtitle}
            </p>
          </Link>
          <div className="mt-3 flex items-center justify-between gap-3">
            <CreatorRow product={product} />
            <RatingMeta product={product} />
          </div>
        </div>
      </div>
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
