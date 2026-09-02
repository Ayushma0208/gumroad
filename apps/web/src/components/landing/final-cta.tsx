import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCta() {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto flex max-w-[1180px] flex-col px-5 py-20 sm:px-8 sm:py-28 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.2em] text-background/50 uppercase">
            Open a store
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-[4.25rem]">
            Put something on the shelf{" "}
            <em className="text-brand">this week.</em>
          </h2>
        </div>
        <div className="mt-10 max-w-sm lg:mt-0">
          <p className="text-sm leading-relaxed text-background/65">
            Create an account, publish a product, send the link. The rest is
            delivery, payouts, and a quieter inbox.
          </p>
          <Link
            href="/signup?as=creator"
            className={cn(
              buttonVariants({ size: "xl" }),
              "mt-6 rounded-xl bg-background text-foreground hover:bg-background/90",
            )}
          >
            Start selling
          </Link>
        </div>
      </div>
    </section>
  );
}
