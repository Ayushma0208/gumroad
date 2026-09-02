import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { featuredCreators } from "@/lib/mock/catalog";
import { formatCompactNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Creators",
};

export default function CreatorsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Directory
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Creators
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Independent stores on Lumen. Full profiles, follow graphs, and live
        catalogs will connect to the creators module next.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {featuredCreators.map((creator) => (
          <Link
            key={creator.id}
            href={`/creators/${creator.slug}`}
            className="group overflow-hidden rounded-2xl border border-border bg-card"
          >
            <span className="relative block aspect-[4/3]">
              <Image
                src={creator.coverUrl}
                alt=""
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </span>
            <span className="block p-4">
              <span className="block font-medium">{creator.name}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {formatCompactNumber(creator.followerCount)} following
              </span>
            </span>
          </Link>
        ))}
      </div>
    </Container>
  );
}
