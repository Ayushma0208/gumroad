import type { Metadata } from "next";
import { NotificationPreferencesExperience } from "@/components/notifications/notification-preferences-experience";

export const metadata: Metadata = {
  title: "Notifications · Account",
  robots: { index: false, follow: false },
};

export default function AccountNotificationsPage() {
  return <NotificationPreferencesExperience embedded />;
}
