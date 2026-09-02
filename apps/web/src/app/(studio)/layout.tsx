import Link from "next/link";
import { RequireAuth } from "@/components/auth/require-auth";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

const studioLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/sales", label: "Sales" },
  { href: "/dashboard/analytics", label: "Analytics" },
];

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth creatorOnly>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex items-center gap-8">
              <Logo />
              <nav className="hidden items-center gap-6 md:flex" aria-label="Seller">
                {studioLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/discover"
                className="mr-2 hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
              >
                View storefront
              </Link>
              <ThemeToggle />
              <UserMenu triggerClassName="inline-flex" />
            </div>
          </div>
          <nav
            className={cn(
              "flex gap-4 overflow-x-auto border-t border-border px-5 py-2 md:hidden",
            )}
            aria-label="Seller mobile"
          >
            {studioLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 text-sm text-muted-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}
