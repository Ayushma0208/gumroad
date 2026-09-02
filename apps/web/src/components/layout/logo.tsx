import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-2.5 text-foreground",
        inverse && "text-background",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative flex size-8 items-center justify-center rounded-full bg-foreground transition-transform duration-300 group-hover:scale-105",
          inverse && "bg-background",
        )}
      >
        <span className="size-2 rounded-full bg-brand" />
      </span>
      <span className="font-display text-[1.35rem] leading-none tracking-tight">
        Lumen
      </span>
    </Link>
  );
}
