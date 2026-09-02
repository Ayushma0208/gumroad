import Image from "next/image";
import { Container, Section } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { FadeIn } from "@/components/motion/fade-in";
import { testimonials } from "@/lib/mock/catalog";

export function Testimonials() {
  return (
    <Section id="stories" className="bg-card/35">
      <Container>
        <FadeIn>
          <SectionHeading
            eyebrow="Stories"
            title="What it feels like from the other side of the checkout."
            className="mb-12 max-w-3xl"
          />
        </FadeIn>
        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <FadeIn key={item.id} delay={index * 0.07}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-background p-6 sm:p-8">
                <blockquote className="font-display text-xl leading-snug tracking-tight text-balance">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-3">
                  <span className="relative size-10 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={item.avatarUrl}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </FadeIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}
