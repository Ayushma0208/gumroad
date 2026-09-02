import { Container } from "@/components/layout/container";
import { trustStats } from "@/lib/mock/landing";

export function LandingStats() {
  const line = trustStats
    .map((stat) => `${stat.value} ${stat.label}`)
    .join("  ·  ");

  return (
    <section
      aria-label="Platform credibility"
      className="border-y border-border py-8 sm:py-10"
    >
      <Container>
        <p className="max-w-3xl font-display text-2xl leading-snug tracking-tight text-balance sm:text-3xl">
          Trusted by independent studios in sixty-four countries — without
          turning their buyers into inventory.
        </p>
      </Container>
      <div className="mt-8 overflow-hidden border-t border-border pt-5">
        <div className="flex w-max animate-marquee motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <p
              key={copy}
              className="px-6 font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase sm:text-[0.8rem]"
              aria-hidden={copy === 1}
            >
              {line}
              <span className="px-8">·</span>
              {line}
              <span className="px-8">·</span>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
