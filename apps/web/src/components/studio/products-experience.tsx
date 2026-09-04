"use client";

import {
  Archive,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Package,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { ProductStatusBadge } from "@/components/studio/status-badge";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { StudioPage } from "@/components/studio/studio-page";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useArchiveProductMutation,
  useDeleteProductMutation,
  useDuplicateProductMutation,
  useStudioProducts,
} from "@/hooks/use-studio";
import { formatDate, formatPrice } from "@/lib/format";
import { productKindCopy } from "@/lib/studio/copy";
import { productPath } from "@/lib/paths";
import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import type { StudioProduct, StudioProductStatus } from "@/types/studio";

type StatusFilter = "all" | StudioProductStatus;
type SortKey = "updated" | "revenue" | "sales" | "title";

export function ProductsExperience() {
  const { user } = useAuth();
  const query = useStudioProducts(user?.id);
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("updated");

  const products = useMemo(() => {
    const list = query.data ?? [];
    const q = debounced.trim().toLowerCase();
    return list
      .filter((product) => (status === "all" ? true : product.status === status))
      .filter((product) =>
        q
          ? `${product.title} ${product.shortDescription}`.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "revenue") return b.revenueCents - a.revenueCents;
        if (sort === "sales") return b.salesCount - a.salesCount;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [debounced, query.data, sort, status]);

  if (query.isPending) {
    return (
      <StudioPage>
        <ProductsHeader count={0} />
        <div className="mt-8">
          <TableSkeleton />
        </div>
      </StudioPage>
    );
  }

  if (query.isError) {
    return (
      <StudioPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </StudioPage>
    );
  }

  const all = query.data ?? [];

  return (
    <StudioPage>
      <ProductsHeader count={all.length} />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="h-11 rounded-xl pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          aria-label="Filter by status"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          aria-label="Sort products"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="updated">Last updated</option>
          <option value="revenue">Revenue</option>
          <option value="sales">Sales</option>
          <option value="title">Name</option>
        </select>
      </div>

      {all.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            full={false}
            icon={Package}
            title="No products yet"
            description="Start with a kit, course, template, or bundle. Drafts stay private until you publish."
            actionHref="/dashboard/products/new"
            actionLabel="Create a product"
          />
        </div>
      ) : products.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Nothing matches those filters.
        </p>
      ) : (
        <ProductCollection products={products} />
      )}
    </StudioPage>
  );
}

function ProductsHeader({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Products</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {count === 0
            ? "Your catalog is empty."
            : `${count} product${count === 1 ? "" : "s"} in the store.`}
        </p>
      </div>
      <Link
        href="/dashboard/products/new"
        className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
      >
        Create product
      </Link>
    </div>
  );
}

function ProductCollection({ products }: { products: StudioProduct[] }) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const router = useRouter();
  const showToast = useToastStore((state) => state.show);
  const duplicate = useDuplicateProductMutation(userId);
  const archive = useArchiveProductMutation(userId);
  const remove = useDeleteProductMutation(userId);
  const [pendingDelete, setPendingDelete] = useState<StudioProduct | null>(null);

  return (
    <>
      <ul className="mt-6 divide-y divide-border lg:hidden">
        {products.map((product) => (
          <li key={product.id} className="flex gap-3 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.coverUrl}
              alt=""
              className="size-16 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{product.title}</p>
                <ProductActions
                  product={product}
                  onDuplicate={() =>
                    void duplicate.mutateAsync(product.id).then((copy) => {
                      showToast({ title: "Duplicated", description: copy?.title });
                      if (copy) router.push(`/dashboard/products/${copy.id}/edit`);
                    })
                  }
                  onArchive={() =>
                    void archive.mutateAsync(product.id).then(() =>
                      showToast({ title: "Status updated" }),
                    )
                  }
                  onDelete={() => setPendingDelete(product)}
                />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <ProductStatusBadge status={product.status} />
                <span className="text-xs text-muted-foreground">
                  {formatPrice(product.priceCents, product.currency)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {product.salesCount} sales · {formatPrice(product.revenueCents, product.currency)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="pb-3 font-medium">Product</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Price</th>
              <th className="pb-3 font-medium">Sales</th>
              <th className="pb-3 font-medium">Revenue</th>
              <th className="pb-3 font-medium">Updated</th>
              <th className="pb-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border/70 last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.coverUrl}
                      alt=""
                      className="size-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {productKindCopy[product.kind].label}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <ProductStatusBadge status={product.status} />
                </td>
                <td className="py-3 pr-4 tabular-nums">
                  {product.pricingModel === "free"
                    ? "Free"
                    : product.pricingModel === "pwyw"
                      ? `PWYW · ${formatPrice(product.priceCents, product.currency)}`
                      : formatPrice(product.priceCents, product.currency)}
                </td>
                <td className="py-3 pr-4 tabular-nums">{product.salesCount}</td>
                <td className="py-3 pr-4 tabular-nums">
                  {formatPrice(product.revenueCents, product.currency)}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {formatDate(product.updatedAt)}
                </td>
                <td className="py-3 text-right">
                  <ProductActions
                    product={product}
                    onDuplicate={() =>
                      void duplicate.mutateAsync(product.id).then((copy) => {
                        showToast({ title: "Duplicated", description: copy?.title });
                        if (copy) router.push(`/dashboard/products/${copy.id}/edit`);
                      })
                    }
                    onArchive={() =>
                      void archive.mutateAsync(product.id).then(() =>
                        showToast({ title: "Status updated" }),
                      )
                    }
                    onDelete={() => setPendingDelete(product)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4">
          <div
            role="dialog"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-2xl bg-background p-6 shadow-lg ring-1 ring-foreground/10"
          >
            <h2 id="delete-title" className="font-display text-2xl tracking-tight">
              Delete {pendingDelete.title}?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This removes it from your catalog. Existing buyers keep their files.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => {
                  void remove.mutateAsync(pendingDelete.id).then(() => {
                    showToast({ title: "Product deleted" });
                    setPendingDelete(null);
                  });
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ProductActions({
  product,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  product: StudioProduct;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "shrink-0",
        )}
        aria-label={`Actions for ${product.title}`}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem
          onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
        >
          <Pencil />
          Edit
        </DropdownMenuItem>
        {product.status === "published" ? (
          <DropdownMenuItem
            onClick={() => window.open(productPath(product.slug), "_blank")}
          >
            <ExternalLink />
            View product
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onArchive}>
          <Archive />
          {product.status === "archived" ? "Restore" : "Archive"}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
