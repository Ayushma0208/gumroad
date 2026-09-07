import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoverExperience } from "@/components/discover/discover-experience";
import { DiscoverSkeleton } from "@/components/discover/discover-skeleton";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Browse an edited catalog of digital products from independent creators on Lumen. Search by product, creator, or category.",
  alternates: { canonical: "/discover" },
  openGraph: {
    title: "Discover · Lumen",
    description:
      "Search digital products, creators, and categories on Lumen.",
    url: "/discover",
  },
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverSkeleton />}>
      <DiscoverExperience />
    </Suspense>
  );
}
