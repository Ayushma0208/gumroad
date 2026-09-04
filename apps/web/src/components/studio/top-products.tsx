"use client";

import { formatCompactNumber, formatPrice } from "@/lib/format";
import type { StudioProduct } from "@/types/studio";

export function TopProducts({ products }: { products: StudioProduct[] }) {
  if (products.length === 0) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        Publish a product to see ranking here.
      </p>
    );
  }

  const max = Math.max(...products.map((product) => product.revenueCents), 1);

  return (
    <ol className="space-y-4">
      {products.map((product, index) => (
        <li key={product.id} className="flex items-center gap-3">
          <span className="w-4 text-xs tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.coverUrl}
            alt=""
            className="size-11 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.title}</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.round((product.revenueCents / max) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatCompactNumber(product.salesCount)} sales ·{" "}
              {formatPrice(product.revenueCents, product.currency)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
