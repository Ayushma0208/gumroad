import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  ProductPriceNote,
  ProductReviews,
} from "@/components/product/product-sections";
import { getCreatorProfile, profileFromSummary } from "@/lib/api/creators";
import {
  getProductBySlug,
  listProductSlugs,
  listRelatedProducts,
} from "@/lib/api/products";
import { discoverCategoryPath } from "@/lib/paths";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const slugs = await listProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.title,
    description: product.subtitle,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, creatorProfile] = await Promise.all([
    listRelatedProducts(product),
    getCreatorProfile(product.creator.slug),
  ]);
  const creator =
    creatorProfile ?? profileFromSummary(product.creator, related.length + 1);

  return (
    <>
      <Container className="pt-8 pb-28 sm:pt-12 lg:pb-20">
        <nav className="text-sm text-muted-foreground">
          <Link href="/discover" className="hover:text-foreground">
            Discover
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <Link
            href={discoverCategoryPath(product.categorySlug)}
            className="hover:text-foreground"
          >
            {product.categoryLabel}
          </Link>
        </nav>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:gap-16">
          <FadeIn>
            <ProductGallery title={product.title} images={product.images} />
          </FadeIn>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductHeroCopy product={product} />
            <ProductPriceNote product={product} />
            <div className="mt-8 hidden lg:block">
              <ProductPurchaseCard product={product} />
            </div>
          </div>
        </div>

        <div className="mt-16 space-y-20 lg:mt-24">
          <ProductDescription product={product} />
          <ProductIncludes items={product.includedItems} />
          {creator ? (
            <section>
              <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
                The maker
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-tight">
                From {creator.storeName ?? creator.name}
              </h2>
              <div className="mt-8">
                <CreatorProfile creator={creator} />
              </div>
            </section>
          ) : null}
          <ProductReviews
            rating={product.rating}
            reviewCount={product.reviewCount}
            reviews={product.reviews}
          />
        </div>

        {related.length > 0 ? (
          <section className="mt-20 lg:mt-28">
            <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
              Continue
            </p>
            <h2 className="mt-2 font-display text-3xl tracking-tight">
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
    </>
  );
}
