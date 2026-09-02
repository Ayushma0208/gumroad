import { getCreatorProfileBySlug } from "@/lib/mock/creators";
import { products } from "@/lib/mock/catalog";
import type { CreatorProfile, CreatorSummary } from "@/types/catalog";

function countProducts(slug: string): number {
  return products.filter((product) => product.creator.slug === slug).length;
}

export async function getCreatorProfile(
  slug: string,
): Promise<CreatorProfile | null> {
  const profile = getCreatorProfileBySlug(slug);
  if (profile) {
    return { ...profile, productCount: countProducts(slug) };
  }

  const fromProduct = products.find((product) => product.creator.slug === slug);
  if (!fromProduct) return null;

  return profileFromSummary(fromProduct.creator, countProducts(slug));
}

export function profileFromSummary(
  creator: CreatorSummary,
  productCount: number,
): CreatorProfile {
  return {
    ...creator,
    coverUrl: creator.avatarUrl,
    bio: creator.headline ?? "Independent creator on Lumen.",
    storeName: creator.name,
    productCount,
    followerCount: 0,
  };
}
