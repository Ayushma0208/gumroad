"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { HeroShowcase } from "@/components/landing/hero-showcase";
import { FadeInOnLoad } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24">
      <Container>
        <FadeInOnLoad>
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            A marketplace for independent makers
          </p>
          <h1 className="mt-5 max-w-[18ch] font-display text-[2.75rem] leading-[0.98] tracking-tight text-balance sm:text-6xl lg:text-[5.15rem]">
            Your work, sold with <em className="text-brand">taste</em>.
          </h1>
        </FadeInOnLoad>

        <div className="mt-10 grid items-end gap-10 lg:mt-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <FadeInOnLoad delay={0.08}>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
              Lumen is where designers, musicians, writers, and teachers publish
              digital products — and keep the relationship with the people who
              buy them.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/become-a-creator"
                className={cn(
                  buttonVariants({ size: "xl" }),
                  "rounded-xl transition-transform duration-200 active:scale-[0.98]",
                )}
              >
                Start selling
                <ArrowRight />
              </Link>
              <Link
                href="/discover"
                className={cn(
                  buttonVariants({ variant: "outline", size: "xl" }),
                  "rounded-xl",
                )}
              >
                Explore products
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Ten percent. No monthly rent on your own audience.
            </p>
          </FadeInOnLoad>

          <HeroShowcase />
        </div>
      </Container>
    </section>
  );
}
