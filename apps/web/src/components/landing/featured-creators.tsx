import Image from "next/image";
import Link from "next/link";
import { Container, Section } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { FadeIn } from "@/components/motion/fade-in";
import { formatCompactNumber, formatPrice } from "@/lib/format";
import {
  featuredCreators,
  getFeaturedProductForCreator,
} from "@/lib/mock/catalog";
import { productPath } from "@/lib/paths";

export function FeaturedCreators() {
  return (
    <Section>
      <Container>
        <FadeIn>
          <SectionHeading
            eyebrow="Creators"
            title="Stores with a point of view."
            description="Independent shops — not profiles in a feed."
            className="mb-12"
          />
        </FadeIn>
        <div className="grid gap-6 sm:grid-cols-2">
          {featuredCreators.map((creator, index) => {
            const product = getFeaturedProductForCreator(creator.slug);
            return (
              <FadeIn key={creator.id} delay={index * 0.06}>
                <article className="group grid overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <Link
                    href={`/creators/${creator.slug}`}
                    className="flex flex-col p-5 sm:p-6"
                  >
                    <span className="relative size-14 overflow-hidden rounded-full bg-muted">
                      <Image
                        src={creator.avatarUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </span>
                    <h3 className="mt-5 font-display text-2xl tracking-tight">
                      {creator.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {creator.bio}
                    </p>
                    <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">
                      {formatCompactNumber(creator.followerCount)} following ·{" "}
                      {creator.productCount} products
                    </p>
                  </Link>
                  {product ? (
                    <Link
                      href={productPath(product.slug)}
                      className="relative min-h-44 sm:min-h-full"
                    >
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent p-4 text-white">
                        <span className="block text-sm font-medium">
                          {product.title}
                        </span>
                        <span className="text-xs text-white/80">
                          {formatPrice(product.priceCents, product.currency)}
                        </span>
                      </span>
                    </Link>
                  ) : null}
                </article>
              </FadeIn>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
