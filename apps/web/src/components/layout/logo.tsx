import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-2.5 text-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className="relative flex size-8 items-center justify-center rounded-full bg-foreground transition-transform duration-300 group-hover:scale-105"
      >
        <span className="size-2 rounded-full bg-brand" />
      </span>
      <span className="font-display text-[1.35rem] leading-none tracking-tight">
        Lumen
      </span>
    </Link>
  );
}
