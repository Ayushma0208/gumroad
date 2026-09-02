"use client";

import { LayoutDashboard, LogOut, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useAuthStore } from "@/stores/auth-store";
import { isCreatorRole } from "@/types/auth";
import { cn } from "@/lib/utils";

export function UserMenu({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthHydrated();
  const logout = useAuthStore((state) => state.logout);
  const becomeCreator = useAuthStore((state) => state.becomeCreator);

  if (!hasHydrated) {
    return <div className="hidden h-8 w-24 md:block" />;
  }

  if (!user) {
    return (
      <>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "hidden md:inline-flex",
          )}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className={cn(
            buttonVariants({ size: "sm" }),
            "hidden h-8 px-3 md:inline-flex",
          )}
        >
          Sign up
        </Link>
      </>
    );
  }

  const creator = isCreatorRole(user.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "hidden max-w-40 md:inline-flex",
          triggerClassName,
        )}
      >
        <span className="truncate">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate text-foreground">{user.name}</span>
            <span className="block truncate font-normal">
              {creator ? "Seller" : "Customer"} · {user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {creator ? (
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>
              <LayoutDashboard />
              Seller dashboard
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => {
                becomeCreator();
                router.push("/dashboard");
              }}
            >
              <Store />
              Open a seller store
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => router.push("/library")}>
            <ShoppingBag />
            Library
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MobileAuthLinks({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthHydrated();
  const logout = useAuthStore((state) => state.logout);
  const becomeCreator = useAuthStore((state) => state.becomeCreator);

  if (!hasHydrated || !user) {
    return (
      <>
        <Link
          href="/login"
          onClick={onNavigate}
          className="rounded-lg px-2 py-3 text-base text-foreground hover:bg-muted"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          onClick={onNavigate}
          className={cn(buttonVariants({ size: "xl" }), "mt-8 w-full")}
        >
          Sign up
        </Link>
      </>
    );
  }

  const creator = isCreatorRole(user.role);

  return (
    <>
      <p className="px-2 pt-4 text-sm text-muted-foreground">
        {user.name} · {creator ? "Seller" : "Customer"}
      </p>
      {creator ? (
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="rounded-lg px-2 py-3 text-base text-foreground hover:bg-muted"
        >
          Seller dashboard
        </Link>
      ) : (
        <button
          type="button"
          className="rounded-lg px-2 py-3 text-left text-base text-foreground hover:bg-muted"
          onClick={() => {
            becomeCreator();
            onNavigate();
            router.push("/dashboard");
          }}
        >
          Open a seller store
        </button>
      )}
      <Link
        href="/library"
        onClick={onNavigate}
        className="rounded-lg px-2 py-3 text-base text-foreground hover:bg-muted"
      >
        Library
      </Link>
      <Button
        variant="ghost"
        className="mt-4 justify-start"
        onClick={() => {
          logout();
          onNavigate();
          router.push("/");
        }}
      >
        Sign out
      </Button>
    </>
  );
}
