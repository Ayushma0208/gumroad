import type { Metadata } from "next";
import { BecomeCreatorPage } from "@/components/creator/become-creator-page";

export const metadata: Metadata = {
  title: "Become a creator",
};

export default function BecomeACreatorRoute() {
  return <BecomeCreatorPage />;
}
