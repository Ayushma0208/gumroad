import { redirect } from "next/navigation";

export default function NotificationSettingsRedirectPage() {
  redirect("/account/notifications");
}
