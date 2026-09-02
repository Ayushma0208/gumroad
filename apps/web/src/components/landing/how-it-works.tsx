import Image from "next/image";
import { Container, Section } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { FadeIn } from "@/components/motion/fade-in";
import { howItWorksSteps } from "@/lib/mock/landing";
import { cn } from "@/lib/utils";

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="scroll-mt-24">
      <Container>
        <FadeIn>
          <SectionHeading
            eyebrow="How it works"
            title="Make it. Show it. Get paid."
            description="A short walk from the studio to someone’s library — without a feed in the middle."
            className="mb-14 max-w-3xl"
          />
        </FadeIn>
        <ol className="grid gap-12 md:grid-cols-3 md:gap-0">
          {howItWorksSteps.map((step, index) => {
            const last = index === howItWorksSteps.length - 1;
            return (
              <FadeIn key={step.number} delay={index * 0.08}>
                <li className="md:px-4 lg:px-6">
                  <div className="relative aspect-[5/4] overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={`https://images.unsplash.com/${step.imageId}?auto=format&fit=crop&w=1200&q=80`}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="relative mt-8">
                    <span
                      aria-hidden
                      className={cn(
                        "bg-border absolute top-1.5 left-3 hidden h-px md:block",
                        last
                          ? "md:hidden"
                          : "right-[-1.5rem] lg:right-[-1.75rem]",
                      )}
                    />
                    <span
                      aria-hidden
                      className="relative z-10 mb-5 block size-3 rounded-full bg-brand"
                    />
                    <p className="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
                      {step.number} · {step.caption}
                    </p>
                    <h3 className="mt-3 font-display text-2xl tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              </FadeIn>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}
