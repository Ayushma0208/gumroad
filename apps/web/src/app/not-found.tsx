import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-20 text-center">
        <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
          404
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">
          This page is not on the shelf.
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          The link may be old, or the product is no longer published.
        </p>
        <Link
          href="/discover"
          className={cn(buttonVariants({ size: "xl" }), "mt-8 rounded-xl")}
        >
          Back to the marketplace
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
