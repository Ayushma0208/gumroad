import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { CreatorProfile } from "@/components/creator/creator-profile";
import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/motion/fade-in";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchaseCard } from "@/components/product/product-purchase-card";
import {
  ProductDescription,
  ProductHeroCopy,
  ProductIncludes,
} from "@/components/product/product-sections";
import { ProductReviewsSection } from "@/components/product/product-reviews-section";
import { styleCanvasVars } from "@/components/studio/storefront-preview";
import type { CreatorProfile as CatalogCreator, Product, ProductDetail } from "@/types/catalog";
import {
  hasCustomPageStyle,
  parsePageStyle,
  STUDIO_FONT_HREF,
  type PageStyle,
} from "@/lib/studio/page-style";
import { discoverCategoryPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

function resolvedStyle(product: ProductDetail): PageStyle {
  return parsePageStyle(product.pageStyle);
}

export function productHasCustomPage(product: Pick<ProductDetail, "pageStyle">) {
  return hasCustomPageStyle(product.pageStyle);
}

function themeVars(style: PageStyle): CSSProperties {
  return {
    ...styleCanvasVars(style),
    ["--background" as string]: style.colors.background,
    ["--foreground" as string]: style.colors.text,
    ["--card" as string]: style.colors.panel,
    ["--popover" as string]: style.colors.panel,
    ["--border" as string]: style.colors.border,
    ["--input" as string]: style.colors.border,
    ["--primary" as string]: style.colors.accent,
    ["--primary-foreground" as string]: style.colors.accentText,
    ["--muted" as string]: style.colors.panel,
    ["--muted-foreground" as string]: style.colors.text,
    ["--accent" as string]: style.colors.panel,
    ["--accent-foreground" as string]: style.colors.text,
    ["--brand" as string]: style.colors.accent,
    color: style.colors.text,
    background: style.colors.background,
    fontFamily: "var(--pf-body)",
  };
}

export function ThemedProductPage({
  product,
  related,
  creator,
}: {
  product: ProductDetail;
  related: Product[];
  creator: CatalogCreator | null;
}) {
  const style = resolvedStyle(product);
  const layout = style.layout;

  return (
    <div style={themeVars(style)}>
      <link rel="stylesheet" href={STUDIO_FONT_HREF} />
      <Container className="pt-8 pb-28 sm:pt-12 lg:pb-20">
        <nav className="text-sm opacity-70">
          <Link href="/discover" className="hover:opacity-100">
            Discover
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <Link
            href={discoverCategoryPath(product.categorySlug)}
            className="hover:opacity-100"
          >
            {product.categoryLabel}
          </Link>
        </nav>

        {layout === "poster" ? (
          <PosterHero product={product} />
        ) : layout === "launch" ? (
          <LaunchHero product={product} />
        ) : layout === "hero-card" ? (
          <HeroCardHero product={product} />
        ) : layout === "split" ? (
          <SplitHero product={product} />
        ) : layout === "gallery" ? (
          <GalleryHero product={product} />
        ) : layout === "editorial" ? (
          <EditorialHero product={product} />
        ) : layout === "minimal" ? (
          <MinimalHero product={product} />
        ) : layout === "market" ? (
          <MarketHero product={product} />
        ) : (
          <ClassicHero product={product} />
        )}

        <div className="mt-16 space-y-20 lg:mt-24">
          <ProductDescription product={product} />
          <ProductIncludes items={product.includedItems} />
          {creator ? (
            <section>
              <p className="text-xs font-medium tracking-[0.16em] uppercase opacity-70">
                The maker
              </p>
              <h2
                className="mt-2 font-display text-3xl tracking-tight"
                style={{ fontFamily: "var(--pf-heading)" }}
              >
                From {creator.storeName ?? creator.name}
              </h2>
              <div className="mt-8">
                <CreatorProfile creator={creator} />
              </div>
            </section>
          ) : null}
          <ProductReviewsSection productId={product.id} productSlug={product.slug} />
        </div>

        {related.length > 0 ? (
          <section className="mt-20 lg:mt-28">
            <p className="text-xs font-medium tracking-[0.16em] uppercase opacity-70">
              Continue
            </p>
            <h2
              className="mt-2 font-display text-3xl tracking-tight"
              style={{ fontFamily: "var(--pf-heading)" }}
            >
              You might also want
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
      <ProductPurchaseCard product={product} variant="bar" />
    </div>
  );
}

function Heading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn("font-display tracking-tight text-balance", className)}
      style={{ fontFamily: "var(--pf-heading)" }}
    >
      {children}
    </h1>
  );
}

function ClassicHero({ product }: { product: ProductDetail }) {
  return (
    <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:gap-16">
      <FadeIn>
        <ProductGallery title={product.title} images={product.images} />
      </FadeIn>
      <div className="lg:sticky lg:top-28 lg:self-start">
        <ProductHeroCopy product={product} />
        <div className="mt-8 hidden lg:block">
          <ProductPurchaseCard product={product} />
        </div>
      </div>
    </div>
  );
}

function PosterHero({ product }: { product: ProductDetail }) {
  const cover = product.images[0] ?? product.imageUrl;
  return (
    <div className="relative mt-8 overflow-hidden min-h-[28rem]" style={{ borderRadius: "var(--pf-radius)" }}>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative flex min-h-[28rem] flex-col items-center justify-end p-8 text-center text-white sm:p-12">
        <Heading className="text-4xl text-white sm:text-5xl">{product.title}</Heading>
        <p className="mt-4 max-w-xl text-lg text-white/80">{product.subtitle}</p>
        <div className="mt-8 w-full max-w-sm">
          <ProductPurchaseCard product={product} />
        </div>
      </div>
    </div>
  );
}

function LaunchHero({ product }: { product: ProductDetail }) {
  return (
    <div className="mt-10">
      <div className="text-center">
        <Heading className="text-4xl sm:text-6xl">{product.title}</Heading>
        <p className="mx-auto mt-4 max-w-2xl text-lg opacity-80">{product.subtitle}</p>
      </div>
      <div className="mx-auto mt-10 max-w-3xl">
        <ProductGallery title={product.title} images={product.images} />
      </div>
      <div className="mx-auto mt-10 max-w-sm">
        <ProductPurchaseCard product={product} />
      </div>
    </div>
  );
}

function HeroCardHero({ product }: { product: ProductDetail }) {
  return (
    <div className="mt-8 overflow-hidden" style={{ borderRadius: "var(--pf-radius)" }}>
      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_22rem]" style={{ background: "var(--pf-panel)" }}>
        <div>
          <ProductHeroCopy product={product} />
        </div>
        <div className="lg:sticky lg:top-28">
          <ProductPurchaseCard product={product} />
        </div>
      </div>
      <div className="p-6 sm:p-10">
        <ProductGallery title={product.title} images={product.images} />
      </div>
    </div>
  );
}

function SplitHero({ product }: { product: ProductDetail }) {
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[20rem_1fr]">
      <aside
        className="p-6 lg:sticky lg:top-28 lg:self-start"
        style={{
          background: "var(--pf-panel)",
          borderRadius: "var(--pf-radius)",
          border: "var(--pf-border-w) solid var(--pf-border)",
        }}
      >
        <ProductPurchaseCard product={product} />
      </aside>
      <div>
        <ProductHeroCopy product={product} />
        <div className="mt-8">
          <ProductGallery title={product.title} images={product.images} />
        </div>
      </div>
    </div>
  );
}

function GalleryHero({ product }: { product: ProductDetail }) {
  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <ProductGallery title={product.title} images={product.images} />
      <div className="lg:sticky lg:top-28">
        <ProductHeroCopy product={product} />
        <div className="mt-8 hidden lg:block">
          <ProductPurchaseCard product={product} />
        </div>
      </div>
    </div>
  );
}

function EditorialHero({ product }: { product: ProductDetail }) {
  return (
    <div className="mt-12">
      <Heading className="text-center text-4xl sm:text-6xl">{product.title}</Heading>
      <p className="mx-auto mt-4 max-w-2xl text-center text-lg opacity-80">{product.subtitle}</p>
      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_20rem]">
        <ProductGallery title={product.title} images={product.images} />
        <div className="lg:sticky lg:top-28">
          <ProductPurchaseCard product={product} />
        </div>
      </div>
    </div>
  );
}

function MinimalHero({ product }: { product: ProductDetail }) {
  return (
    <div className="mt-10">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-14">
        <FadeIn>
          <ProductGallery title={product.title} images={product.images} />
        </FadeIn>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Heading className="text-4xl sm:text-5xl">{product.title}</Heading>
          <p className="mt-4 text-lg opacity-80">{product.subtitle}</p>
          <div className="mt-8 hidden lg:block">
            <ProductPurchaseCard product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketHero({ product }: { product: ProductDetail }) {
  return (
    <div
      className="mt-8 overflow-hidden"
      style={{
        border: "var(--pf-border-w) solid var(--pf-border)",
        borderRadius: "var(--pf-radius)",
      }}
    >
      <ProductGallery title={product.title} images={product.images} />
      <div
        className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_22rem]"
        style={{ borderTop: "var(--pf-border-w) solid var(--pf-border)" }}
      >
        <ProductHeroCopy product={product} />
        <ProductPurchaseCard product={product} />
      </div>
    </div>
  );
}
