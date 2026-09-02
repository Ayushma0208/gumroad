import {
  AudioLines,
  BookOpen,
  Code2,
  Download,
  FileText,
  ImageIcon,
  Layers,
  LayoutTemplate,
  RefreshCw,
  Sparkles,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/product/star-rating";
import { PRODUCT_TYPE_LABELS } from "@/lib/catalog/query";
import { formatCompactNumber, formatDate, formatPrice } from "@/lib/format";
import { creatorPath, discoverCategoryPath } from "@/lib/paths";
import type {
  IncludeIcon,
  IncludedItem,
  ProductDetail,
  ProductReview,
} from "@/types/catalog";

const includeIcons: Record<IncludeIcon, LucideIcon> = {
  video: Video,
  layers: Layers,
  code: Code2,
  refresh: RefreshCw,
  users: Users,
  file: FileText,
  book: BookOpen,
  image: ImageIcon,
  audio: AudioLines,
  sparkles: Sparkles,
  layout: LayoutTemplate,
  download: Download,
};

export function ProductHeroCopy({
  product,
  className,
}: {
  product: ProductDetail;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
        <Link
          href={discoverCategoryPath(product.categorySlug)}
          className="text-brand hover:text-foreground"
        >
          {product.categoryLabel}
        </Link>
        <span aria-hidden="true">·</span>
        <span>{PRODUCT_TYPE_LABELS[product.productType]}</span>
      </div>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-balance sm:text-5xl">
        {product.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        {product.subtitle}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
        <StarRating value={product.rating} />
        <span className="tabular-nums text-foreground">
          {product.rating.toFixed(1)}
        </span>
        <span className="text-muted-foreground">
          {formatCompactNumber(product.reviewCount)} reviews
          <span className="hidden sm:inline">
            {" "}
            · {formatCompactNumber(product.salesCount)} sold
          </span>
        </span>
      </div>
      <Link
        href={creatorPath(product.creator.slug)}
        className="mt-6 inline-flex items-center gap-3"
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
          <span className="block text-sm font-medium">{product.creator.name}</span>
          <span className="text-sm text-muted-foreground">
            {product.creator.headline}
          </span>
        </span>
      </Link>
    </div>
  );
}

export function ProductDescription({ product }: { product: ProductDetail }) {
  return (
    <section className="max-w-2xl">
      <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
        The work
      </p>
      <h2 className="mt-2 font-display text-3xl tracking-tight">
        What you’re buying
      </h2>
      <div className="mt-6 space-y-4 text-[1.05rem] leading-relaxed text-muted-foreground">
        {product.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
        <CopyColumn title="Why it matters" items={product.highlights} />
        <CopyColumn title="Who it’s for" items={product.audience} />
        <CopyColumn title="What you leave with" items={product.outcomes} />
      </div>
    </section>
  );
}

function CopyColumn({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-medium tracking-tight">{title}</h3>
      <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ProductIncludes({ items }: { items: IncludedItem[] }) {
  return (
    <section>
      <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
        Contents
      </p>
      <h2 className="mt-2 font-display text-3xl tracking-tight">
        What’s included
      </h2>
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {items.map((item) => {
          const Icon = includeIcons[item.icon];
          return (
            <li key={item.id} className="flex gap-4 py-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block font-medium">{item.label}</span>
                {item.detail ? (
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {item.detail}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ProductReviews({
  rating,
  reviewCount,
  reviews,
}: {
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
}) {
  const distribution = buildDistribution(rating, reviewCount);

  return (
    <section>
      <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
        Reviews
      </p>
      <h2 className="mt-2 font-display text-3xl tracking-tight">
        From people who bought it
      </h2>

      <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-5xl tracking-tight">
            {rating.toFixed(1)}
          </p>
          <StarRating value={rating} size="md" className="mt-2" />
          <p className="mt-2 text-sm text-muted-foreground">
            {formatCompactNumber(reviewCount)} reviews
          </p>
        </div>
        <ul className="w-full max-w-sm space-y-1.5">
          {distribution.map((row) => (
            <li key={row.stars} className="flex items-center gap-3 text-xs">
              <span className="w-6 tabular-nums text-muted-foreground">
                {row.stars}★
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-foreground"
                  style={{ width: `${row.percent}%` }}
                />
              </span>
              <span className="w-8 text-right tabular-nums text-muted-foreground">
                {row.percent}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      {reviews.length > 0 ? (
        <ul className="mt-10 divide-y divide-border border-t border-border">
          {reviews.map((review) => (
            <li key={review.id} className="py-6">
              <div className="flex items-start gap-3">
                <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                  <Image
                    src={review.authorAvatarUrl}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-sm font-medium">{review.authorName}</p>
                    <StarRating value={review.rating} />
                    <p className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {review.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Reviews for this product will show here after checkout goes live.
        </p>
      )}
    </section>
  );
}

function buildDistribution(rating: number, count: number) {
  const fiveShare = rating >= 4.8 ? 0.76 : rating >= 4.5 ? 0.64 : 0.5;
  const fourShare = rating >= 4.8 ? 0.18 : 0.26;
  const threeShare = 0.04;
  const twoShare = 0.01;
  const shares = [fiveShare, fourShare, threeShare, twoShare];
  const oneShare = Math.max(0, 1 - shares.reduce((sum, n) => sum + n, 0));
  const percents = [...shares, oneShare].map((share) =>
    Math.round(share * 100),
  );
  percents[0] += 100 - percents.reduce((sum, n) => sum + n, 0);

  return [5, 4, 3, 2, 1].map((stars, index) => ({
    stars,
    percent: Math.max(0, percents[index] ?? 0),
    count: Math.round(((percents[index] ?? 0) / 100) * count),
  }));
}

export function ProductPriceNote({ product }: { product: ProductDetail }) {
  return (
    <p className="mt-6 font-display text-3xl lg:hidden">
      {formatPrice(product.priceCents, product.currency)}
    </p>
  );
}
