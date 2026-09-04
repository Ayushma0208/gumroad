import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StudioPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
