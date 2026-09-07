import {
  BarChart3,
  FolderTree,
  LayoutDashboard,
  MessageSquareWarning,
  Package,
  Receipt,
  ScrollText,
  Settings,
  ShieldAlert,
  Store,
  TicketPercent,
  Users,
} from "lucide-react";

export const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/creators", label: "Creators", icon: Store, exact: false },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, exact: false },
  { href: "/admin/orders", label: "Orders", icon: Receipt, exact: false },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent, exact: false },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareWarning, exact: false },
  { href: "/admin/reports", label: "Reports", icon: ShieldAlert, exact: false },
  { href: "/admin/audit-log", label: "Audit log", icon: ScrollText, exact: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function isAdminNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export { BarChart3 };
