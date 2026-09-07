import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreatorStoreExperience } from "@/components/creator/creator-store-experience";
import { getCreatorBySlug } from "@/lib/api/creators";
import { creatorPath, creatorStoreUrl } from "@/lib/paths";
import { siteConfig } from "@/lib/site";

type CreatorPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: CreatorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getCreatorBySlug(slug);
  if (!payload) {
    return { title: "Creator not found" };
  }
  const title = `${payload.creator.storeName} — Digital Products & Resources`;
  const description =
    payload.creator.bio ||
    `Shop published products from ${payload.creator.storeName} on ${siteConfig.name}.`;
  const url = creatorStoreUrl(payload.creator.slug);
  return {
    title,
    description,
    alternates: { canonical: creatorPath(payload.creator.slug) },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      images: payload.creator.banner
        ? [{ url: payload.creator.banner }]
        : payload.creator.avatar
          ? [{ url: payload.creator.avatar }]
          : undefined,
    },
  };
}

export default async function CreatorStorePage({ params }: CreatorPageProps) {
  const { slug } = await params;
  const payload = await getCreatorBySlug(slug);
  if (!payload) notFound();
  return <CreatorStoreExperience slug={slug} initial={payload} />;
}
