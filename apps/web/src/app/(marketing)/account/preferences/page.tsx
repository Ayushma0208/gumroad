import type { Metadata } from "next";
import { AccountPreferencesExperience } from "@/components/account/account-preferences-experience";

export const metadata: Metadata = {
  title: "Preferences · Account",
  robots: { index: false, follow: false },
};

export default function AccountPreferencesPage() {
  return <AccountPreferencesExperience />;
}
