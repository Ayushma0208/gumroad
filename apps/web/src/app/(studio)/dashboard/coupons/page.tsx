import type { Metadata } from "next";
import { CouponsExperience } from "@/components/studio/coupons-experience";

export const metadata: Metadata = {
  title: "Coupons",
  robots: { index: false, follow: false },
};

export default function CouponsPage() {
  return <CouponsExperience />;
}
