import { PayoutDetailExperience } from "@/components/studio/payout-detail-experience";

export default async function DashboardPayoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PayoutDetailExperience payoutId={id} />;
}
