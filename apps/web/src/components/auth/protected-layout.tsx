import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/require-auth";

export function ProtectedLayout({
  children,
  gate = "user",
}: {
  children: ReactNode;
  gate?: "user" | "creator" | "admin";
}) {
  return <RequireAuth gate={gate}>{children}</RequireAuth>;
}
