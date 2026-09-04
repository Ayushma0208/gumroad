"use client";

import { LogOut, Menu, PanelLeft, Store } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { UserAvatar } from "@/components/auth/user-avatar";
import { Logo } from "@/components/layout/logo";
import {
  isStudioNavActive,
  studioNav,
} from "@/components/layout/studio-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth, useLogoutMutation } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function StudioShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const storeName = user?.creatorProfile?.storeName;

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      return next;
    });
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center",
            collapsed ? "justify-center px-2" : "px-5",
          )}
        >
          <Logo markOnly={collapsed} />
        </div>
        <StudioNavList
          pathname={pathname}
          collapsed={collapsed}
          className={cn("flex-1", collapsed ? "px-2" : "px-3")}
        />
        <div
          className={cn(
            "mt-auto space-y-1 border-t border-sidebar-border py-3",
            collapsed ? "px-2" : "px-3",
          )}
        >
          {!collapsed && storeName ? (
            <p className="truncate px-2 pb-1 text-xs text-muted-foreground">
              {storeName}
            </p>
          ) : null}
          <Link
            href="/discover"
            title="Marketplace"
            className={cn(
              "flex items-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "justify-center p-2" : "gap-2 px-2 py-2",
            )}
          >
            <Store className="size-4 shrink-0" />
            {collapsed ? <span className="sr-only">Marketplace</span> : "Marketplace"}
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "flex w-full items-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
              collapsed ? "justify-center p-2" : "gap-2 px-2 py-2",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className="size-4" />
            {collapsed ? null : "Collapse"}
          </button>
          {user ? <SidebarAccount collapsed={collapsed} /> : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Open seller menu"
                    />
                  }
                >
                  <Menu />
                </SheetTrigger>
                <SheetContent side="left" className="flex w-80 flex-col px-4 py-5">
                  <SheetHeader className="mb-4 p-0">
                    <SheetTitle className="sr-only">Seller menu</SheetTitle>
                    <Logo />
                  </SheetHeader>
                  <StudioNavList
                    pathname={pathname}
                    onNavigate={() => setOpen(false)}
                  />
                  <div className="mt-auto space-y-1 border-t border-border pt-4">
                    <Link
                      href="/discover"
                      onClick={() => setOpen(false)}
                      className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Store className="size-4" />
                      Marketplace
                    </Link>
                    {user ? <SidebarAccount /> : null}
                  </div>
                </SheetContent>
              </Sheet>
              <p className="truncate text-sm font-medium">
                {studioNav.find((item) =>
                  isStudioNavActive(pathname, item.href, item.exact),
                )?.label ?? "Studio"}
              </p>
            </div>
            <p className="hidden truncate text-sm text-muted-foreground lg:block">
              {storeName ?? "Your store"}
            </p>
            <div className="flex items-center gap-1">
              <Link
                href="/discover"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "hidden sm:inline-flex",
                )}
              >
                Marketplace
              </Link>
              <ThemeToggle />
              <UserMenu triggerClassName="inline-flex" />
            </div>
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarAccount({ collapsed = false }: { collapsed?: boolean }) {
  const { user } = useAuth();
  const logout = useLogoutMutation();
  const router = useRouter();

  if (!user) return null;

  async function onLogout() {
    await logout.mutateAsync();
    router.push("/");
    router.refresh();
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg",
        collapsed ? "justify-center px-0 py-1" : "px-1 py-1",
      )}
    >
      <UserAvatar user={user} />
      {collapsed ? null : (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Log out"
        onClick={() => void onLogout()}
        disabled={logout.isPending}
      >
        <LogOut />
      </Button>
    </div>
  );
}

function StudioNavList({
  pathname,
  onNavigate,
  className,
  collapsed = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
  collapsed?: boolean;
}) {
  return (
    <nav className={cn("flex flex-col gap-0.5", className)} aria-label="Seller">
      {studioNav.map((item) => {
        const Icon = item.icon;
        const active = isStudioNavActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex min-h-10 items-center rounded-lg text-sm transition-colors duration-200",
              collapsed ? "justify-center px-2" : "gap-2.5 px-3 py-2",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
          </Link>
        );
      })}
    </nav>
  );
}
