import type { Metadata } from "next";
import { AnalyticsExperience } from "@/components/studio/analytics-experience";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return <AnalyticsExperience />;
}
