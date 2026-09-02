import { ProductCard } from "@/components/product/product-card";
import { FadeIn } from "@/components/motion/fade-in";
import type { CatalogSpotlight } from "@/lib/catalog/query";

export function DiscoverFeatured({
  spotlight,
  categoryLabel,
}: {
  spotlight: CatalogSpotlight;
  categoryLabel: string | null;
}) {
  const badge = spotlight.lead.editorsPick
    ? "Editor’s pick"
    : spotlight.lead.trending
      ? "Trending"
      : "Popular this week";

  return (
    <section aria-labelledby="discover-featured-heading">
      <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
            This week
          </p>
          <h2
            id="discover-featured-heading"
            className="mt-2 font-display text-3xl tracking-tight sm:text-4xl"
          >
            {categoryLabel ? `Popular in ${categoryLabel}` : "Popular this week"}
          </h2>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          {badge} — a short shelf, not a feed. The rest of the catalog is below.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <FadeIn className="h-full lg:col-span-7">
          <ProductCard product={spotlight.lead} layout="featured" priority />
        </FadeIn>
        <div className="flex flex-col justify-center gap-0 lg:col-span-5">
          {spotlight.supporting.map((product, index) => (
            <FadeIn key={product.id} delay={0.05 * (index + 1)}>
              <div className="flex gap-4 border-t border-border py-5 first:border-t-0 first:pt-0 lg:first:pt-1">
                <span className="w-6 shrink-0 pt-1 font-mono text-xs text-muted-foreground">
                  0{index + 2}
                </span>
                <div className="min-w-0 flex-1">
                  <ProductCard product={product} layout="compact" />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
