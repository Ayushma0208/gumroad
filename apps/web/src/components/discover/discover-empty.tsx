"use client";

import Link from "next/link";
import { FilterX, SearchX, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/catalog";

export function DiscoverEmpty({
  kind,
  query,
  categoryLabel,
  categories = [],
  onClear,
  onSuggestion,
}: {
  kind: "search" | "category" | "filters";
  query?: string;
  categoryLabel?: string | null;
  categories?: Category[];
  onClear: () => void;
  onSuggestion: (value: string) => void;
}) {
  const copy = emptyCopy(kind, query, categoryLabel);

  const Icon =
    kind === "search" ? SearchX : kind === "category" ? Store : FilterX;

  return (
    <div className="flex flex-col items-center py-16 text-center sm:py-24">
      <div className="mb-5 flex size-12 items-center justify-center rounded-xl border border-border bg-muted/60">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="font-display text-3xl tracking-tight sm:text-4xl">
        {copy.title}
      </p>
      <p className="mt-3 max-w-md text-muted-foreground">{copy.description}</p>
      {kind === "search" ? (
        <ul className="mt-4 max-w-sm space-y-1 text-sm text-muted-foreground">
          <li>Check spelling</li>
          <li>Try fewer words</li>
          <li>Browse a category below</li>
        </ul>
      ) : null}
      <Button className="mt-8 h-11 rounded-xl px-5" onClick={onClear}>
        {copy.action}
      </Button>
      {kind === "search" && categories.length > 0 ? (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={`/discover?category=${encodeURIComponent(category.slug)}`}
              className="h-9 rounded-full border border-border px-3.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {category.label}
            </Link>
          ))}
        </div>
      ) : null}
      {kind === "search" && categories.length === 0 ? (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {["UI kit", "Notion", "Course", "Template"].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestion(suggestion)}
              className="h-9 rounded-full border border-border px-3.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function emptyCopy(
  kind: "search" | "category" | "filters",
  query?: string,
  categoryLabel?: string | null,
) {
  if (kind === "search") {
    return {
      title: query ? `No products found for “${query}”` : "No products found",
      description:
        "Try a shorter phrase, a creator name, or explore categories.",
      action: "Clear search",
    };
  }

  if (kind === "category") {
    return {
      title: "Nothing in this room yet",
      description: categoryLabel
        ? `${categoryLabel} is quiet right now. Browse the full catalog, or pick another room.`
        : "This aisle is quiet. Browse everything, or try another category.",
      action: "Browse all products",
    };
  }

  return {
    title: "No matching products",
    description:
      "Nothing fits these filters. Loosen price, type, or rating and the shelf will fill in.",
    action: "Clear filters",
  };
}
