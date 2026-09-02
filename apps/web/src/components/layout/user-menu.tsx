"use client";

import {
  LayoutDashboard,
  Library,
  LogOut,
  Receipt,
  Shield,
  Store,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/auth/user-avatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useLogoutMutation } from "@/hooks/use-auth";
import { isAdminRole, isCreatorRole, roleLabel } from "@/types/auth";
import { cn } from "@/lib/utils";

export function UserMenu({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const logout = useLogoutMutation();

  if (isLoading) {
    return <Skeleton className="hidden h-8 w-24 md:block" />;
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
  const admin = isAdminRole(user.role);

  async function onLogout() {
    await logout.mutateAsync();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "hidden max-w-48 gap-2 md:inline-flex",
          triggerClassName,
        )}
      >
        <UserAvatar user={user} />
        <span className="truncate">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate text-foreground">{user.name}</span>
            <span className="block truncate font-normal">
              {roleLabel(user.role)} · {user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {creator ? (
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>
              <LayoutDashboard />
              Dashboard
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => router.push("/become-a-creator")}>
              <Store />
              Start selling
            </DropdownMenuItem>
          )}
          {admin ? (
            <DropdownMenuItem onClick={() => router.push("/admin")}>
              <Shield />
              Admin
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={() => router.push("/library")}>
            <Library />
            My library
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/orders")}>
            <Receipt />
            Orders
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <UserRound />
            Profile
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void onLogout();
            }}
          >
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MobileAuthLinks({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const logout = useLogoutMutation();

  if (isLoading) {
    return <Skeleton className="mt-6 h-10 w-full" />;
  }

  if (!user) {
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
          className={cn(buttonVariants({ size: "xl" }), "mt-6 w-full")}
        >
          Sign up
        </Link>
      </>
    );
  }

  const creator = isCreatorRole(user.role);

  return (
    <>
      <div className="mt-4 flex items-center gap-3 px-2">
        <UserAvatar user={user} size="md" />
        <div>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{roleLabel(user.role)}</p>
        </div>
      </div>
      {creator ? (
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="rounded-lg px-2 py-3 text-base text-foreground hover:bg-muted"
        >
          Dashboard
        </Link>
      ) : (
        <Link
          href="/become-a-creator"
          onClick={onNavigate}
          className="rounded-lg px-2 py-3 text-base text-foreground hover:bg-muted"
        >
          Start selling
        </Link>
      )}
      <Link
        href="/library"
        onClick={onNavigate}
        className="rounded-lg px-2 py-3 text-base text-foreground hover:bg-muted"
      >
        My library
      </Link>
      <Link
        href="/orders"
        onClick={onNavigate}
        className="rounded-lg px-2 py-3 text-base text-foreground hover:bg-muted"
      >
        Orders
      </Link>
      <Link
        href="/profile"
        onClick={onNavigate}
        className="rounded-lg px-2 py-3 text-base text-foreground hover:bg-muted"
      >
        Profile
      </Link>
      <Button
        variant="ghost"
        className="mt-4 justify-start"
        onClick={() => {
          void logout.mutateAsync().then(() => {
            onNavigate();
            router.push("/");
            router.refresh();
          });
        }}
      >
        Log out
      </Button>
    </>
  );
}
