"use client";

import { LogOut, Menu, PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { adminNav, isAdminNavActive } from "@/components/layout/admin-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const logout = useLogoutMutation();

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
        <AdminNavList
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
          {!collapsed ? (
            <p className="truncate px-2 pb-1 text-xs text-muted-foreground">
              {user?.email}
            </p>
          ) : null}
          <button
            type="button"
            title="Collapse"
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              "flex w-full items-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "justify-center p-2" : "gap-2 px-2 py-2",
            )}
          >
            <PanelLeft className="size-4" />
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Open menu"
                  />
                }
              >
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b border-border px-4 py-4 text-left">
                  <SheetTitle>Admin</SheetTitle>
                </SheetHeader>
                <AdminNavList
                  pathname={pathname}
                  className="px-3 py-4"
                  onNavigate={() => setOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <p className="text-sm font-medium">Operations</p>
          </div>
          <p className="hidden text-sm text-muted-foreground lg:block">
            Platform operations
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/discover"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Marketplace
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void logout.mutateAsync()}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function AdminNavList({
  pathname,
  collapsed,
  className,
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={cn("space-y-1", className)} aria-label="Admin">
      {adminNav.map((item) => {
        const active = isAdminNavActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            onClick={onNavigate}
            className={cn(
              "flex items-center rounded-lg text-sm transition-colors",
              collapsed ? "justify-center p-2" : "gap-2 px-2 py-2",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed ? <span>{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
