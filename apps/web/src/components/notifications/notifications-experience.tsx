"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/use-notifications";
import type { NotificationType } from "@/lib/api/notifications";
import { formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const filters: Array<{ label: string; value: "all" | "unread" | NotificationType }> = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Purchases", value: "PURCHASE_SUCCESS" },
  { label: "Sales", value: "CREATOR_SALE" },
  { label: "Reviews", value: "REVIEW_RECEIVED" },
];

export function NotificationsExperience() {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [page, setPage] = useState(1);
  const unreadCount = useUnreadNotificationCount();
  const query = useNotifications({
    page,
    limit: 20,
    unread: filter === "unread" ? true : undefined,
    type: filter === "all" || filter === "unread" ? "all" : filter,
  });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = query.data?.items ?? [];

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        title="Notifications"
        description={
          unreadCount.data
            ? `${unreadCount.data} unread`
            : "Purchase, sales, and account updates in one place."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!unreadCount.data}
              onClick={() => void markAll.mutateAsync()}
            >
              Mark all read
            </Button>
            <Link href="/settings/notifications">
              <Button type="button" variant="ghost" size="sm">
                Preferences
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((item) => (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={filter === item.value ? "default" : "outline"}
            className="rounded-lg"
            onClick={() => {
              setFilter(item.value);
              setPage(1);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="mt-8 divide-y divide-border border-t border-border">
        {query.isPending ? (
          <p className="py-10 text-sm text-muted-foreground">Loading notifications…</p>
        ) : query.isError ? (
          <div className="py-10">
            <p className="text-sm font-medium">Unable to load notifications</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void query.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-sm text-muted-foreground">
            No notifications in this view yet.
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex w-full flex-col gap-1 py-4 text-left transition-colors hover:bg-muted/30",
                item.unread && "bg-muted/20",
              )}
              onClick={() => {
                if (item.unread) void markRead.mutateAsync(item.id);
                if (item.href) router.push(item.href);
              }}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeDate(item.createdAt)}
                </span>
              </span>
              <span className="text-sm text-muted-foreground">{item.message}</span>
            </button>
          ))
        )}
      </div>

      {query.data && query.data.meta.totalPages > 1 ? (
        <div className="mt-8 flex justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={!query.data.meta.hasPreviousPage}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!query.data.meta.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </Container>
  );
}
