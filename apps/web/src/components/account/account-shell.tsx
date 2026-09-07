"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  accountNav,
  isAccountNavActive,
} from "@/components/layout/account-nav";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current =
    accountNav.find((item) =>
      isAccountNavActive(pathname, item.href, item.exact),
    )?.label ?? "Account";

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Account
          </p>
          <h1 className="font-display text-2xl tracking-tight">{current}</h1>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon" aria-label="Open account menu" />
            }
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border px-4 py-4 text-left">
              <SheetTitle>Account</SheetTitle>
            </SheetHeader>
            <AccountNavList
              pathname={pathname}
              className="px-3 py-4"
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden lg:block">
          <p className="px-3 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Account
          </p>
          <AccountNavList pathname={pathname} className="mt-4" />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}

function AccountNavList({
  pathname,
  className,
  onNavigate,
}: {
  pathname: string;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={cn("flex flex-col gap-0.5", className)} aria-label="Account">
      {accountNav.map((item) => {
        const Icon = item.icon;
        const active = isAccountNavActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
