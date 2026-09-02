import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { ProductPurchaseActions } from "@/components/product/product-purchase-actions";
import { getProductBySlug } from "@/lib/api/products";
import { formatPrice } from "@/lib/format";
import { products } from "@/lib/mock/catalog";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

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

  const related = products
    .filter(
      (item) =>
        item.id !== product.id && item.categorySlug === product.categorySlug,
    )
    .slice(0, 3);

  return (
    <Container className="py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
            {product.categoryLabel}
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-balance sm:text-5xl">
            {product.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{product.subtitle}</p>
          <p className="mt-8 font-display text-3xl">
            {formatPrice(product.priceCents, product.currency)}
          </p>
          <p className="mt-6 text-[0.95rem] leading-relaxed text-muted-foreground">
            {product.description}
          </p>
          <Link
            href={`/creators/${product.creator.slug}`}
            className="mt-6 flex items-center gap-3"
          >
            <span className="relative size-10 overflow-hidden rounded-full bg-muted">
              <Image
                src={product.creator.avatarUrl}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            </span>
            <span>
              <span className="block text-sm font-medium">
                {product.creator.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {product.creator.headline}
              </span>
            </span>
          </Link>
          <ProductPurchaseActions product={product} />
        </div>
      </div>
      {related.length > 0 ? (
        <div className="mt-20">
          <h2 className="font-display text-3xl tracking-tight">Also in this room</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      ) : null}
    </Container>
  );
}
