"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/use-notifications";
import { formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const unreadQuery = useUnreadNotificationCount();
  const listQuery = useNotifications({ limit: 8, enabled: open });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = unreadQuery.data ?? 0;
  const items = listQuery.data?.items ?? [];

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell />
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-medium text-brand-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className={cn(
              "absolute right-0 z-50 mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-xl border border-border bg-background shadow-lg",
              "max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:mt-0 max-sm:w-auto",
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <p className="text-sm font-medium">Notifications</p>
              {unread > 0 ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => void markAll.mutateAsync()}
                >
                  Mark all read
                </button>
              ) : null}
            </div>
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {listQuery.isPending ? (
                <li className="px-3 py-6 text-sm text-muted-foreground">
                  Loading…
                </li>
              ) : items.length === 0 ? (
                <li className="px-3 py-6 text-sm text-muted-foreground">
                  You’re all caught up.
                </li>
              ) : (
                items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full flex-col gap-1 px-3 py-3 text-left transition-colors hover:bg-muted/50",
                        item.unread && "bg-muted/30",
                      )}
                      onClick={() => {
                        if (item.unread) void markRead.mutateAsync(item.id);
                        setOpen(false);
                        if (item.href) router.push(item.href);
                      }}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium">{item.title}</span>
                        {item.unread ? (
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand" />
                        ) : null}
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {item.message}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelativeDate(item.createdAt)}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="border-t border-border p-2">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "w-full justify-center rounded-lg",
                )}
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
