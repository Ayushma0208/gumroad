"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

function subscribeModifier() {
  return () => undefined;
}

function getModifierSnapshot() {
  return /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";
}

function getModifierServerSnapshot() {
  return "⌘";
}

export function DiscoverSearch({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const modifier = useSyncExternalStore(
    subscribeModifier,
    getModifierSnapshot,
    getModifierServerSnapshot,
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground sm:left-5 sm:size-[1.15rem]" />
      <input
        ref={inputRef}
        id="discover-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search products, creators, or categories"
        autoComplete="off"
        className={cn(
          "h-14 w-full rounded-2xl border border-border bg-card pr-24 pl-12 text-base outline-none transition-[border-color,box-shadow] sm:h-16 sm:pr-28 sm:pl-14 sm:text-[1.05rem]",
          "appearance-none placeholder:text-muted-foreground/80 [&::-webkit-search-cancel-button]:hidden",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:right-4"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 items-center gap-0.5 rounded-lg border border-border bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground sm:inline-flex">
          {modifier}K
        </kbd>
      )}
    </div>
  );
}
