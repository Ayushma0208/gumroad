import type { Metadata } from "next";
import { AccountSecurityExperience } from "@/components/account/account-security-experience";

export const metadata: Metadata = {
  title: "Security · Account",
  robots: { index: false, follow: false },
};

export default function AccountSecurityPage() {
  return <AccountSecurityExperience />;
}
