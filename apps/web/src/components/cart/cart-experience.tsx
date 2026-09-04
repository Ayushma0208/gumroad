"use client";

import { LoaderCircle, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ApiError } from "@/lib/api/client";
import { EmptyState } from "@/components/layout/empty-state";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  useCart,
  useClearCart,
  useRemoveCartItem,
} from "@/hooks/use-cart";
import { loginPath } from "@/lib/auth/paths";
import { PRODUCT_TYPE_LABELS } from "@/lib/catalog/query";
import { formatPrice } from "@/lib/format";
import { productPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import type { ProductType } from "@/types/catalog";
import { useToastStore } from "@/stores/toast-store";

function typeLabel(type: string) {
  if (type in PRODUCT_TYPE_LABELS) {
    return PRODUCT_TYPE_LABELS[type as ProductType];
  }
  if (type === "DIGITAL_DOWNLOAD") return "Kit";
  if (type === "COURSE") return "Course";
  if (type === "TEMPLATE") return "Template";
  if (type === "BUNDLE") return "Pack";
  return type;
}

export function CartExperience() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const cartQuery = useCart();
  const remove = useRemoveCartItem();
  const clear = useClearCart();
  const showToast = useToastStore((state) => state.show);

  if (!authLoading && !isAuthenticated) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Sign in to see your bag"
        description="Your cart lives with your account, so it is still there after a refresh."
        actionHref={loginPath("/cart")}
        actionLabel="Sign in"
      />
    );
  }

  if (!authLoading && user && user.role !== "CUSTOMER") {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="This bag is for customers"
        description="Creator and admin accounts manage stores. Sign in as a customer to buy."
        actionHref="/discover"
        actionLabel="Browse the catalog"
      />
    );
  }

  if (authLoading || (cartQuery.isPending && !cartQuery.data)) {
    return <CartSkeleton />;
  }

  if (cartQuery.isError) {
    const unauthorized =
      cartQuery.error instanceof ApiError && cartQuery.error.status === 401;
    if (unauthorized) {
      return (
        <EmptyState
          icon={ShoppingBag}
          title="Sign in to see your bag"
          description="Your cart lives with your account, so it is still there after a refresh."
          actionHref={loginPath("/cart")}
          actionLabel="Sign in"
        />
      );
    }
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <div className="mb-5 flex size-12 items-center justify-center rounded-xl border border-border bg-muted/60">
          <ShoppingBag className="size-5 text-muted-foreground" />
        </div>
        <p className="font-display text-3xl tracking-tight sm:text-4xl">
          Unable to load your cart
        </p>
        <p className="mt-3 max-w-md text-muted-foreground">
          The bag didn’t arrive. Try again in a moment.
        </p>
        <Button
          className="mt-8 h-11 rounded-xl px-5"
          onClick={() => void cartQuery.refetch()}
        >
          Try again
        </Button>
      </Container>
    );
  }

  const cart = cartQuery.data;
  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is waiting."
        description="Discover something worth creating with."
        actionHref="/discover"
        actionLabel="Explore products"
      />
    );
  }

  const summary = cart!.summary;
  const pendingId = remove.isPending ? remove.variables : null;

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Bag"
        title="Cart"
        description={`${summary.itemCount} ${summary.itemCount === 1 ? "piece" : "pieces"} ready when you are. Totals are calculated on the server.`}
        actions={
          <Button
            variant="ghost"
            className="rounded-xl"
            disabled={clear.isPending}
            onClick={() => {
              void clear.mutateAsync().then(() => {
                showToast({ title: "Bag cleared" });
              });
            }}
          >
            {clear.isPending ? <LoaderCircle className="animate-spin" /> : null}
            Clear bag
          </Button>
        }
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 p-5 sm:gap-5">
              <Link
                href={productPath(item.product.slug)}
                className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28"
              >
                <Image
                  src={item.product.coverImage}
                  alt=""
                  fill
                  className="object-cover"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                      {typeLabel(item.product.productType)}
                    </p>
                    <Link
                      href={productPath(item.product.slug)}
                      className="mt-1 block font-medium tracking-tight transition-colors hover:text-brand"
                    >
                      {item.product.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.product.creator.storeName}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-xl tracking-tight">
                    {formatPrice(item.product.priceCents, item.product.currency)}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    {item.product.available
                      ? "Quantity 1 · Instant download"
                      : "No longer available"}
                  </p>
                  <button
                    type="button"
                    disabled={remove.isPending}
                    onClick={() => {
                      void remove.mutateAsync(item.id).then(() => {
                        showToast({ title: "Removed from bag" });
                      });
                    }}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {pendingId === item.id ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 sm:p-6">
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Order summary
          </p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(summary.subtotalCents, summary.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>{formatPrice(summary.discountCents, summary.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="font-medium">Total</dt>
              <dd className="font-display text-2xl tracking-tight">
                {formatPrice(summary.totalCents, summary.currency)}
              </dd>
            </div>
          </dl>
          <Link
            href="/checkout"
            className={cn(
              buttonVariants({ size: "xl" }),
              "mt-6 w-full rounded-xl",
            )}
          >
            Checkout
          </Link>
          <Link
            href="/discover"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "mt-2 w-full rounded-xl",
            )}
          >
            Continue browsing
          </Link>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Payment is not connected yet. Nothing will be charged.
          </p>
        </aside>
      </div>
    </Container>
  );
}

function CartSkeleton() {
  return (
    <Container className="py-8 sm:py-12">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="mt-3 h-10 w-40" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <div className="space-y-4 rounded-2xl border border-border p-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex gap-4">
              <Skeleton className="size-24 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-5 w-48" />
                <Skeleton className="mt-3 h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </Container>
  );
}
