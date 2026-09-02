import { ArrowUpRight, BarChart3, Globe2, ShieldCheck, Truck, Users } from "lucide-react";
import Link from "next/link";
import { Container, Section } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { FadeIn } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { creatorBenefits } from "@/lib/mock/landing";
import { cn } from "@/lib/utils";

const icons = [Globe2, ShieldCheck, Truck, Users, BarChart3];

export function CreatorBenefits() {
  return (
    <Section id="creators" className="scroll-mt-24 bg-card/40">
      <Container>
        <FadeIn>
          <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="For creators"
              title="Keep the work. Keep the names."
              description="Built for people who already make things — not for people who want a side hustle dashboard."
            />
            <Link
              href="/become-a-creator"
              className={cn(buttonVariants({ size: "lg" }), "w-fit rounded-xl")}
            >
              Start selling
              <ArrowUpRight />
            </Link>
          </div>
        </FadeIn>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {creatorBenefits.map((tile, index) => {
            const Icon = icons[index] ?? Globe2;
            const featured = index === 0;
            return (
              <FadeIn key={tile.title} delay={index * 0.05} className={tile.span}>
                <article
                  className={cn(
                    "flex h-full flex-col justify-between rounded-xl border border-border bg-background p-6 sm:p-8",
                    featured && "min-h-[16rem] lg:min-h-[22rem]",
                  )}
                >
                  <Icon className="size-5 text-brand" />
                  <div className="mt-8">
                    <h3
                      className={cn(
                        "font-medium tracking-tight",
                        featured && "font-display text-3xl sm:text-4xl",
                      )}
                    >
                      {tile.title}
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                      {tile.body}
                    </p>
                  </div>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
