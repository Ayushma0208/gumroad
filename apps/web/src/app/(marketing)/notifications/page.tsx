import type { Metadata } from "next";
import { ProtectedLayout } from "@/components/auth/protected-layout";
import { NotificationsExperience } from "@/components/notifications/notifications-experience";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <ProtectedLayout gate="user">
      <NotificationsExperience />
    </ProtectedLayout>
  );
}
