import { redirect } from "next/navigation";
import { productPath } from "@/lib/paths";

type LegacyProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyProductPage({
  params,
}: LegacyProductPageProps) {
  const { slug } = await params;
  redirect(productPath(slug));
}
