"use client";

import { Menu, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileAuthLinks, UserMenu } from "@/components/layout/user-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { navLinks } from "@/lib/site";
import { cn } from "@/lib/utils";
import { selectCartCount, useCartStore } from "@/stores/cart-store";
import { isCreatorRole } from "@/types/auth";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const cartCount = useCartStore(selectCartCount);
  const { user, isLoading } = useAuth();
  const creator = user ? isCreatorRole(user.role) : false;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled
          ? "border-border/80 bg-background/80 backdrop-blur-xl"
          : "border-transparent bg-background/40 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-5 sm:h-[4.25rem] sm:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                active={isNavActive(pathname, link.href)}
              >
                {link.label}
              </NavLink>
            ))}
            {!isLoading && !creator ? (
              <NavLink
                href="/become-a-creator"
                active={pathname.startsWith("/become-a-creator")}
              >
                Start selling
              </NavLink>
            ) : null}
            {creator ? (
              <NavLink href="/dashboard" active={pathname.startsWith("/dashboard")}>
                Dashboard
              </NavLink>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/discover"
            aria-label="Search products"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <Search />
          </Link>
          <ThemeToggle />
          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} items`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "relative",
            )}
          >
            <ShoppingBag />
            {cartCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-medium text-brand-foreground">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <UserMenu />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="px-5 py-6">
              <SheetHeader className="mb-4 p-0">
                <SheetTitle className="font-display text-2xl">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1" aria-label="Mobile">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={
                      isNavActive(pathname, link.href) ? "page" : undefined
                    }
                    className={cn(
                      "rounded-lg px-2 py-3 text-base hover:bg-muted",
                      isNavActive(pathname, link.href)
                        ? "bg-muted font-medium text-foreground"
                        : "text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {!creator ? (
                  <Link
                    href="/become-a-creator"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-2 py-3 text-base text-foreground hover:bg-muted"
                  >
                    Start selling
                  </Link>
                ) : null}
              </nav>
              <MobileAuthLinks onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function isNavActive(pathname: string, href: string) {
  if (href.startsWith("/#") || href === "/") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-sm transition-colors duration-200",
        active
          ? "font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
