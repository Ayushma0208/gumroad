"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginPath, signupPath } from "@/lib/auth/paths";

export function AuthSwitchLink({
  to,
  children,
}: {
  to: "login" | "signup";
  children: string;
}) {
  const next = useSearchParams().get("next");
  const href = to === "login" ? loginPath(next) : signupPath(next);

  return (
    <Link
      href={href}
      className="text-foreground underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}
