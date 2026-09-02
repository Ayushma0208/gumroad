export type UserRole = "CUSTOMER" | "CREATOR" | "ADMIN";

export type CreatorStoreProfile = {
  displayName: string;
  storeName: string;
  slug: string;
  bio: string;
  category: string;
  avatarUrl?: string | null;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  creatorProfile?: CreatorStoreProfile | null;
};

export function homeForRole(role: UserRole): string {
  if (role === "ADMIN") return "/admin";
  if (role === "CREATOR") return "/dashboard";
  return "/library";
}

export function isCreatorRole(role: UserRole): boolean {
  return role === "CREATOR" || role === "ADMIN";
}

export function isAdminRole(role: UserRole): boolean {
  return role === "ADMIN";
}

export function roleLabel(role: UserRole): string {
  if (role === "ADMIN") return "Admin";
  if (role === "CREATOR") return "Creator";
  return "Customer";
}

export function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "L";
  if (parts.length === 1) {
    const first = parts[0] ?? "L";
    return first.slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.[0] ?? "L";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}
