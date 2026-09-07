import Image from "next/image";
import Link from "next/link";
import { Container, Section } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { FadeIn } from "@/components/motion/fade-in";
import { listCreators } from "@/lib/api/creators";
import { listFeaturedProducts } from "@/lib/api/products";
import { formatPrice } from "@/lib/format";
import { creatorPath, productPath } from "@/lib/paths";

export async function FeaturedCreators() {
  let creators: {
    id: string;
    name: string;
    slug: string;
    bio: string;
    avatarUrl: string | null;
    productCount: number;
  }[] = [];
  const featuredByCreator = new Map<
    string,
    { slug: string; title: string; imageUrl: string; priceCents: number; currency: "USD" | "INR" }
  >();

  try {
    const [directory, featured] = await Promise.all([
      listCreators({ limit: 4 }),
      listFeaturedProducts(),
    ]);
    creators = directory.items.map((item) => ({
      id: item.creator.id,
      name: item.creator.displayName || item.creator.storeName,
      slug: item.creator.slug,
      bio: item.creator.bio,
      avatarUrl: item.creator.avatar,
      productCount: item.stats.productCount,
    }));
    for (const product of featured) {
      if (!featuredByCreator.has(product.creator.slug)) {
        featuredByCreator.set(product.creator.slug, {
          slug: product.slug,
          title: product.title,
          imageUrl: product.imageUrl,
          priceCents: product.priceCents,
          currency: product.currency,
        });
      }
    }
  } catch {
    return null;
  }

  if (creators.length === 0) return null;

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
          {creators.map((creator, index) => {
            const product = featuredByCreator.get(creator.slug);
            return (
              <FadeIn key={creator.id} delay={index * 0.06}>
                <article className="group grid overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <Link
                    href={creatorPath(creator.slug)}
                    className="flex flex-col p-5 sm:p-6"
                  >
                    <span className="relative size-14 overflow-hidden rounded-full bg-muted">
                      {creator.avatarUrl ? (
                        <Image
                          src={creator.avatarUrl}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <h3 className="mt-5 font-display text-2xl tracking-tight">
                      {creator.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {creator.bio}
                    </p>
                    <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">
                      {creator.productCount} products
                    </p>
                  </Link>
                  {product?.imageUrl ? (
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
