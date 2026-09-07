import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { listCreators } from "@/lib/api/creators";
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
  }[] = [];
  let loadError = false;

  try {
    const live = await listCreators({ limit: 24 });
    items = live.items.map((item) => ({
      id: item.creator.id,
      storeName: item.creator.storeName,
      slug: item.creator.slug,
      bio: item.creator.bio,
      avatar: item.creator.avatar,
      productCount: item.stats.productCount,
    }));
  } catch {
    loadError = true;
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
      {loadError ? (
        <p className="mt-10 text-sm text-muted-foreground">
          We couldn’t load the creator directory right now. Please try again shortly.
        </p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No public creator stores yet. Be the first to{" "}
          <Link href="/become-a-creator" className="underline underline-offset-4">
            start selling
          </Link>
          .
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((creator) => (
            <Link
              key={creator.id}
              href={creatorPath(creator.slug)}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"
            >
              <CreatorAvatar
                src={creator.avatar}
                name={creator.storeName}
                size="lg"
              />
              <h2 className="mt-4 font-medium tracking-tight">
                {creator.storeName}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {creator.bio}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {creator.productCount} products
              </p>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
