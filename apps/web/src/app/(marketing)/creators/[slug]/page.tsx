import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { featuredCreators, products } from "@/lib/mock/catalog";
import { formatCompactNumber } from "@/lib/format";

type CreatorPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CreatorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const creator = featuredCreators.find((item) => item.slug === slug);
  return { title: creator?.name ?? "Creator" };
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { slug } = await params;
  const creator = featuredCreators.find((item) => item.slug === slug);
  if (!creator) notFound();

  const catalog = products.filter((product) => product.creator.slug === slug);

  return (
    <Container className="py-12 sm:py-16">
      <div className="relative mb-10 overflow-hidden rounded-3xl">
        <div className="relative aspect-[21/9] min-h-48">
          <Image
            src={creator.coverUrl}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />
        </div>
        <div className="relative -mt-16 flex items-end gap-4 px-2 sm:px-4">
          <div className="relative size-24 overflow-hidden rounded-full border-4 border-background bg-muted sm:size-28">
            <Image
              src={creator.avatarUrl}
              alt=""
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>
          <div className="pb-2">
            <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
              {creator.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatCompactNumber(creator.followerCount)} following ·{" "}
              {creator.productCount} products
            </p>
          </div>
        </div>
      </div>
      <p className="max-w-2xl text-lg text-muted-foreground">{creator.bio}</p>
      <h2 className="mt-12 font-display text-3xl tracking-tight">Products</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
