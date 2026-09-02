import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";
import { footerSocial } from "@/lib/mock/landing";

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "/discover", label: "Discover" },
      { href: "/#categories", label: "Categories" },
      { href: "/creators", label: "Creators" },
      { href: "/discover?sort=trending", label: "Trending" },
    ],
  },
  {
    title: "Creators",
    links: [
      { href: "/signup?as=creator", label: "Start selling" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#creators", label: "Why Lumen" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/login", label: "Help" },
      { href: "/signup", label: "Create account" },
      { href: "/login", label: "Sign in" },
      { href: "/discover", label: "Marketplace" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/login", label: "Privacy" },
      { href: "/login", label: "Terms" },
      { href: "/login", label: "Cookies" },
      { href: "/login", label: "Licenses" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-[1.3fr_repeat(4,minmax(0,1fr))]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A quieter marketplace for independent creators. Sell digital
              products. Keep the relationship with your audience.
            </p>
            <ul className="mt-6 flex gap-4">
              {footerSocial.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-10" />
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Lumen. All rights reserved.</p>
          <p>Made for people who still make things.</p>
        </div>
      </Container>
    </footer>
  );
}
