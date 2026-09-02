import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { FadeIn } from "@/components/motion/fade-in";
import { ProductCard } from "@/components/product/product-card";
import { buttonVariants } from "@/components/ui/button";
import { listFeaturedProducts } from "@/lib/api/products";
import { cn } from "@/lib/utils";

export async function FeaturedProducts() {
  const products = await listFeaturedProducts();
  const [lead, ...rest] = products;

  return (
    <Section>
      <Container>
        <FadeIn>
          <div className="mb-10 flex flex-col gap-6 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Featured"
              title="Work worth owning."
              description="An edited shelf — not an infinite aisle. Kits, courses, sound, and type from people who still make things by hand."
            />
            <Link
              href="/discover"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-fit shrink-0 rounded-xl",
              )}
            >
              Explore products
            </Link>
          </div>
        </FadeIn>
        {lead ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
            <FadeIn className="h-full">
              <ProductCard product={lead} layout="featured" priority />
            </FadeIn>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
              {rest.slice(0, 2).map((product, index) => (
                <FadeIn key={product.id} delay={0.06 * (index + 1)}>
                  <ProductCard product={product} priority={index === 0} />
                </FadeIn>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(2).map((product, index) => (
            <FadeIn key={product.id} delay={index * 0.05}>
              <ProductCard product={product} />
            </FadeIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}
