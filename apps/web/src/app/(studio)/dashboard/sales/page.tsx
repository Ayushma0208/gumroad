import type { Metadata } from "next";
import { SalesExperience } from "@/components/studio/sales-experience";

export const metadata: Metadata = {
  title: "Sales",
};

export default function SalesPage() {
  return <SalesExperience />;
}
