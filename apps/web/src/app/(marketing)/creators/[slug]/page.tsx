import { redirect } from "next/navigation";
import { creatorPath } from "@/lib/paths";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyCreatorRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(creatorPath(slug));
}
