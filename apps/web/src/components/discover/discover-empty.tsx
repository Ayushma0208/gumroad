"use client";

import { SEARCH_SUGGESTIONS } from "@/lib/catalog/query";
import { Button } from "@/components/ui/button";

export function DiscoverEmpty({
  kind,
  query,
  categoryLabel,
  onClear,
  onSuggestion,
}: {
  kind: "search" | "category" | "filters";
  query?: string;
  categoryLabel?: string | null;
  onClear: () => void;
  onSuggestion: (value: string) => void;
}) {
  const copy = emptyCopy(kind, query, categoryLabel);

  return (
    <div className="flex flex-col items-center py-16 text-center sm:py-24">
      <p className="font-display text-3xl tracking-tight sm:text-4xl">
        {copy.title}
      </p>
      <p className="mt-3 max-w-md text-muted-foreground">{copy.description}</p>
      <Button className="mt-8 h-11 rounded-xl px-5" onClick={onClear}>
        {copy.action}
      </Button>
      {kind === "search" ? (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {SEARCH_SUGGESTIONS.map((suggestion) => (
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
      title: "No products found",
      description: query
        ? `Nothing matched “${query}”. Try a creator, a category, or a shorter phrase.`
        : "Nothing matched that search. Try a creator, a category, or a shorter phrase.",
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
