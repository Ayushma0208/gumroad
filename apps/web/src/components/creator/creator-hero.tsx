import Image from "next/image";
import { FadeInOnLoad } from "@/components/motion/fade-in";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { CreatorSocialLinks } from "@/components/creator/creator-social-links";
import { Container } from "@/components/layout/container";
import { cloudinaryThumb } from "@/lib/cloudinary";
import type { CreatorStore } from "@/types/catalog";

export function CreatorHero({
  creator,
  productCount,
  averageRating,
  reviewCount,
}: {
  creator: CreatorStore;
  productCount: number;
  averageRating?: number;
  reviewCount?: number;
}) {
  const productLabel = productCount === 1 ? "product" : "products";

  return (
    <header>
      <div className="relative isolate overflow-hidden">
        <div className="relative h-48 sm:h-56 lg:h-72">
          {creator.banner ? (
            <Image
              src={cloudinaryThumb(creator.banner, 1800)}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 bg-muted"
              style={{
                backgroundImage:
                  "radial-gradient(1200px 280px at 20% 0%, color-mix(in oklch, var(--brand) 28%, transparent), transparent), radial-gradient(900px 240px at 90% 20%, color-mix(in oklch, var(--foreground) 10%, transparent), transparent)",
              }}
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/35 to-background/5" />
        </div>
      </div>

      <Container className="relative -mt-12 pb-10 sm:-mt-16 sm:pb-14">
        <FadeInOnLoad className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:gap-8 sm:text-left">
          <CreatorAvatar
            src={creator.avatar}
            name={creator.storeName}
            size="xl"
            priority
            className="ring-4 ring-background shadow-sm"
          />
          <div className="mt-5 min-w-0 flex-1 sm:mt-0 sm:pb-1">
            <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
              Store
            </p>
            <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
              {creator.storeName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">@{creator.slug}</p>
            {creator.bio ? (
              <p className="mx-auto mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground sm:mx-0">
                {creator.bio}
              </p>
            ) : null}
            <div className="mt-5">
              <CreatorSocialLinks
                website={creator.website}
                socialLinks={creator.socialLinks}
              />
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              {reviewCount && reviewCount > 0 ? (
                <>
                  <span className="tabular-nums text-foreground">
                    {averageRating?.toFixed(1)}
                  </span>{" "}
                  average · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                  <span aria-hidden="true"> · </span>
                </>
              ) : null}
              <span className="tabular-nums text-foreground">{productCount}</span>{" "}
              {productLabel}
            </p>
          </div>
        </FadeInOnLoad>
      </Container>
    </header>
  );
}
