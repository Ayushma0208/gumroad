import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { listCreators } from "@/lib/api/creators";
import { featuredCreators } from "@/lib/mock/catalog";
import { creatorPath } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Creators",
};

export const dynamic = "force-dynamic";

export default async function CreatorsPage() {
  let items: {
    id: string;
    storeName: string;
    slug: string;
    bio: string;
    avatar: string | null;
    productCount: number;
  }[] = featuredCreators.map((creator) => ({
    id: creator.id,
    storeName: creator.storeName ?? creator.name,
    slug: creator.slug,
    bio: creator.bio,
    avatar: creator.avatarUrl,
    productCount: creator.productCount,
  }));

  try {
    const live = await listCreators({ limit: 24 });
    if (live.items.length > 0) {
      items = live.items.map((item) => ({
        id: item.creator.id,
        storeName: item.creator.storeName,
        slug: item.creator.slug,
        bio: item.creator.bio,
        avatar: item.creator.avatar,
        productCount: item.stats.productCount,
      }));
    }
  } catch {
    /* keep the static directory if the API is down */
  }

  return (
    <Container className="py-12 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Directory
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Creators
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Independent stores on Lumen. Open a storefront to browse published work.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((creator) => (
          <Link
            key={creator.id}
            href={creatorPath(creator.slug)}
            className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"
          >
            <CreatorAvatar src={creator.avatar} name={creator.storeName} size="lg" />
            <span className="mt-4 block font-medium">{creator.storeName}</span>
            <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
              {creator.bio}
            </span>
            <span className="mt-3 block text-sm text-muted-foreground">
              {creator.productCount}{" "}
              {creator.productCount === 1 ? "product" : "products"}
            </span>
          </Link>
        ))}
      </div>
    </Container>
  );
}
