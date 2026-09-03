"use client";

import { Menu, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function StudioShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const storeName = user?.creatorProfile?.storeName;

  return (
    <div className="flex min-h-full flex-1">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <StudioNavList pathname={pathname} className="flex-1 px-3" />
        <div className="mt-auto border-t border-sidebar-border p-3">
          {storeName ? (
            <p className="mb-2 truncate px-2 text-xs text-muted-foreground">
              {storeName}
            </p>
          ) : null}
          <Link
            href="/discover"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Store className="size-4" />
            View storefront
          </Link>
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
                <SheetContent side="left" className="w-72 px-4 py-5">
                  <SheetHeader className="mb-4 p-0">
                    <SheetTitle className="sr-only">Seller menu</SheetTitle>
                    <Logo />
                  </SheetHeader>
                  <StudioNavList
                    pathname={pathname}
                    onNavigate={() => setOpen(false)}
                  />
                  <Link
                    href="/discover"
                    onClick={() => setOpen(false)}
                    className="mt-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Store className="size-4" />
                    View storefront
                  </Link>
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
                Storefront
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

function StudioNavList({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
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
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-200",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
            )}
          >
            <Icon className="size-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
