"use client";

import Link from "next/link";
import {
  Bell,
  Heart,
  KeyRound,
  Library,
  MessageSquareText,
  Receipt,
  UserRound,
} from "lucide-react";
import { UserAvatar } from "@/components/auth/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";
import { useOrders } from "@/hooks/use-checkout";
import { formatDate } from "@/lib/format";
import { roleLabel } from "@/types/auth";
import { cn } from "@/lib/utils";

const quickLinks = [
  { href: "/library", label: "Library", icon: Library },
  { href: "/orders", label: "Orders", icon: Receipt },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/reviews", label: "Reviews", icon: MessageSquareText },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/security", label: "Security", icon: KeyRound },
] as const;

export function AccountOverviewExperience() {
  const { user } = useAuth();
  const orders = useOrders();
  const unread = useUnreadNotificationCount();
  const recentOrders = (orders.data ?? []).slice(0, 3);

  if (!user) return null;

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="md" />
          <div>
            <h1 className="font-display text-3xl tracking-tight">{user.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.email} · {roleLabel(user.role)}
            </p>
          </div>
        </div>
        <Link
          href="/account/profile"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
        >
          Edit profile
        </Link>
      </header>

      <section className="mt-10">
        <h2 className="text-sm font-medium">Quick links</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:bg-muted/40"
              >
                <Icon className="size-4 text-muted-foreground" />
                {item.label}
                {item.href === "/account/notifications" && unread.data ? (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {unread.data} unread
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Recent orders</h2>
          <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
        {orders.isPending ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading orders…</p>
        ) : recentOrders.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
            <Link
              href="/discover"
              className={cn(buttonVariants({ size: "sm" }), "mt-4 rounded-lg")}
            >
              Discover products
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/40"
                >
                  <span>
                    Order #{order.id.slice(-8).toUpperCase()}
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatDate(order.createdAt)} · {order.status}
                    </span>
                  </span>
                  <span className="font-mono text-xs uppercase">{order.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-xl border border-border px-4 py-5">
        <h2 className="text-sm font-medium">Security</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Password</dt>
            <dd>Configured</dd>
          </div>
          {user.createdAt ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Member since</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
          ) : null}
        </dl>
        <Link
          href="/account/security"
          className="mt-4 inline-flex text-sm text-muted-foreground hover:text-foreground"
        >
          Manage security
        </Link>
      </section>
    </div>
  );
}
