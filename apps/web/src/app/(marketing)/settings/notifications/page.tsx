import type { Metadata } from "next";
import { ProtectedLayout } from "@/components/auth/protected-layout";
import { NotificationPreferencesExperience } from "@/components/notifications/notification-preferences-experience";

export const metadata: Metadata = {
  title: "Notification preferences",
  robots: { index: false, follow: false },
};

export default function NotificationSettingsPage() {
  return (
    <ProtectedLayout gate="user">
      <NotificationPreferencesExperience />
    </ProtectedLayout>
  );
}
