import {
  Bell,
  Heart,
  KeyRound,
  LayoutDashboard,
  Library,
  MessageSquareText,
  Receipt,
  Settings2,
  UserRound,
} from "lucide-react";

export const accountNav = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/profile", label: "Profile", icon: UserRound, exact: false },
  { href: "/library", label: "Library", icon: Library, exact: false },
  { href: "/orders", label: "Orders", icon: Receipt, exact: false },
  { href: "/wishlist", label: "Wishlist", icon: Heart, exact: false },
  { href: "/account/reviews", label: "Reviews", icon: MessageSquareText, exact: false },
  { href: "/account/notifications", label: "Notifications", icon: Bell, exact: false },
  { href: "/account/security", label: "Security", icon: KeyRound, exact: false },
  { href: "/account/preferences", label: "Preferences", icon: Settings2, exact: false },
] as const;

export function isAccountNavActive(
  pathname: string,
  href: string,
  exact?: boolean,
) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
