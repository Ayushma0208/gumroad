import type { Metadata } from "next";
import { AccountProfileExperience } from "@/components/account/account-profile-experience";

export const metadata: Metadata = {
  title: "Profile · Account",
  robots: { index: false, follow: false },
};

export default function AccountProfilePage() {
  return <AccountProfileExperience />;
}
