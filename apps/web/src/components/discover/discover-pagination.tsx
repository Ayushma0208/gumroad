"use client";

import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/types/catalog";

export function DiscoverPagination({
  pagination,
  onPage,
}: {
  pagination: PaginationMeta;
  onPage: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;

  const pages = visiblePages(pagination.page, pagination.totalPages);

  return (
    <nav
      className="mt-12 flex items-center justify-between gap-3 border-t border-border pt-6"
      aria-label="Pagination"
    >
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        disabled={!pagination.hasPreviousPage}
        onClick={() => onPage(pagination.page - 1)}
      >
        Previous
      </Button>
      <ol className="flex items-center gap-1">
        {pages.map((page) => (
          <li key={page}>
            <button
              type="button"
              className={
                page === pagination.page
                  ? "flex size-9 items-center justify-center rounded-xl bg-foreground text-sm text-background"
                  : "flex size-9 items-center justify-center rounded-xl text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              }
              aria-current={page === pagination.page ? "page" : undefined}
              onClick={() => onPage(page)}
            >
              {page}
            </button>
          </li>
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        disabled={!pagination.hasNextPage}
        onClick={() => onPage(pagination.page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}

function visiblePages(current: number, total: number) {
  const start = Math.max(1, current - 2);
  const end = Math.min(total, start + 4);
  const from = Math.max(1, end - 4);
  return Array.from({ length: end - from + 1 }, (_, index) => from + index);
}
