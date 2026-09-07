import type { Role } from "@prisma/client";
import { forbidden, unauthorized } from "./app-error";
import type { AuthContext } from "../types/auth-context";

export function assertAuthenticated(user: AuthContext | undefined): AuthContext {
  if (!user) throw unauthorized();
  return user;
}

export function assertRole(user: AuthContext, ...roles: Role[]) {
  if (!roles.includes(user.role)) {
    throw forbidden("You do not have permission to perform this action.");
  }
}

export function assertAdmin(user: AuthContext) {
  assertRole(user, "ADMIN");
}

export function assertSelfOrAdmin(user: AuthContext, resourceUserId: string) {
  if (user.role === "ADMIN") return;
  if (user.id !== resourceUserId) {
    throw forbidden("You do not have permission to perform this action.");
  }
}

/** Prefer 404-style denial for cross-tenant reads to reduce existence leaks. */
export function denyCrossTenant(message = "Not found"): never {
  throw forbidden(message);
}
