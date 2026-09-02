export type UserRole = "CUSTOMER" | "CREATOR" | "ADMIN";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export function homeForRole(role: UserRole): string {
  if (role === "CREATOR" || role === "ADMIN") {
    return "/dashboard";
  }
  return "/library";
}

export function isCreatorRole(role: UserRole): boolean {
  return role === "CREATOR" || role === "ADMIN";
}
