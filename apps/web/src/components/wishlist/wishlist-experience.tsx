"use client";

import { Heart, LoaderCircle, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EmptyState } from "@/components/layout/empty-state";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ProductCardSkeleton } from "@/components/product/product-card";
import { StarRating } from "@/components/product/star-rating";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useAddToCart } from "@/hooks/use-cart";
import {
  useRemoveFromWishlist,
  useWishlist,
} from "@/hooks/use-wishlist";
import { loginPath } from "@/lib/auth/paths";
import { cloudinaryThumb } from "@/lib/cloudinary";
import { formatCompactNumber, formatPrice } from "@/lib/format";
import { creatorPath, productPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast-store";
import { cartErrorCopy } from "@/hooks/use-product-cart";
import type { WishlistItem, WishlistSort } from "@/lib/api/wishlist";

const SORT_OPTIONS: { value: WishlistSort; label: string }[] = [
  { value: "recent", label: "Recently added" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest products" },
];

export function WishlistExperience() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [sort, setSort] = useState<WishlistSort>("recent");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 280);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const wishlist = useWishlist({
    page,
    limit: 12,
    sort,
    search: search || undefined,
  });

  if (authLoading) {
    return (
      <Container className="py-8 sm:py-12">
        <PageHeader
          eyebrow="Wishlist"
          title="Your wishlist"
          description="Products you’ve saved for later."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Heart}
        title="Sign in to see your wishlist"
        description="Save products you love and come back to them anytime."
        actionHref={loginPath("/wishlist")}
        actionLabel="Log in"
      />
    );
  }

  const items = wishlist.data?.items ?? [];
  const pagination = wishlist.data?.pagination;
  const firstName = user?.name.split(" ")[0];

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Wishlist"
        title={firstName ? `${firstName}’s wishlist` : "Your wishlist"}
        description="Products you’ve saved for later."
      />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search saved products..."
          aria-label="Search wishlist"
          className="h-11 max-w-md rounded-xl"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="sr-only sm:not-sr-only">Sort</span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as WishlistSort);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-border bg-background px-3 text-foreground"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {wishlist.isError ? (
        <div className="mt-10 rounded-2xl border border-border px-5 py-10 text-center">
          <p className="font-medium">Couldn’t load your wishlist.</p>
          <p className="mt-1 text-sm text-muted-foreground">Please try again.</p>
          <Button
            className="mt-4 rounded-xl"
            variant="outline"
            onClick={() => void wishlist.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : wishlist.isPending ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            full={false}
            icon={Heart}
            title={search ? "No matching saves" : "Your wishlist is empty"}
            description={
              search
                ? "Try a different title or creator name."
                : "Save products you love and come back to them anytime."
            }
            actionHref="/discover"
            actionLabel="Explore Marketplace"
          />
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {pagination?.total ?? items.length} saved{" "}
            {(pagination?.total ?? items.length) === 1 ? "product" : "products"}
          </p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.id}
                  layout={!reduceMotion}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.98, y: -6 }
                  }
                  transition={{ duration: 0.2 }}
                >
                  <WishlistCard item={item} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Container>
  );
}

function WishlistCard({ item }: { item: WishlistItem }) {
  const product = item.product;
  const addToCart = useAddToCart();
  const remove = useRemoveFromWishlist();
  const toast = useToastStore((state) => state.show);
  const [adding, setAdding] = useState(false);

  async function onAddToCart() {
    if (adding || product.owned || !product.available) return;
    setAdding(true);
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
      toast({ title: "Added to cart", description: product.title });
    } catch (error) {
      toast({
        title: "Couldn’t add to cart",
        description: cartErrorCopy(error),
      });
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        {product.coverImage ? (
          <Image
            src={cloudinaryThumb(product.coverImage, 900)}
            alt=""
            fill
            className={cn(
              "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]",
              !product.available && "opacity-50 grayscale",
            )}
          />
        ) : null}
        <WishlistButton
          productId={product.id}
          className="absolute top-3 right-3 z-10"
        />
        {!product.available ? (
          <span className="absolute inset-x-3 bottom-3 rounded-lg bg-background/92 px-3 py-2 text-center text-xs font-medium">
            No longer available
          </span>
        ) : product.owned ? (
          <span className="absolute inset-x-3 bottom-3 rounded-lg bg-background/92 px-3 py-2 text-center text-xs font-medium">
            In your library
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <Link href={productPath(product.slug)}>
          <h2 className="text-[1.05rem] font-medium tracking-tight text-balance transition-colors group-hover:text-brand">
            {product.title}
          </h2>
        </Link>
        <Link
          href={creatorPath(product.creator.slug)}
          className="mt-1 text-sm text-muted-foreground hover:text-foreground"
        >
          {product.creator.storeName}
        </Link>
        {product.reviewCount > 0 ? (
          <div className="mt-2 flex items-center gap-2">
            <StarRating value={product.rating} size="sm" />
            <span className="text-xs text-muted-foreground tabular-nums">
              {product.rating.toFixed(1)} ({formatCompactNumber(product.reviewCount)})
            </span>
          </div>
        ) : null}
        <p className="mt-3 font-mono text-sm">
          {formatPrice(product.priceCents, product.currency)}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {product.owned ? (
            <Link
              href={`/library/${product.id}`}
              className={cn(buttonVariants({ size: "sm" }), "rounded-lg")}
            >
              Open Library
            </Link>
          ) : product.available ? (
            <Button
              size="sm"
              className="rounded-lg"
              disabled={adding}
              onClick={() => void onAddToCart()}
            >
              {adding ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ShoppingBag className="size-4" />
              )}
              Add to cart
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled
            >
              Unavailable
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="rounded-lg"
            onClick={() => void remove.mutateAsync(product.id)}
          >
            Remove
          </Button>
        </div>
      </div>
    </article>
  );
}
