"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/types/catalog";

export function DiscoverCategories({
  categories,
  activeSlug,
  onSelect,
}: {
  categories: Category[];
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}) {
  return (
    <nav aria-label="Categories" className="relative -mx-5 sm:-mx-8">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1 sm:px-8">
        <CategoryChip
          label="All"
          active={!activeSlug}
          onClick={() => onSelect(null)}
        />
        {categories.map((category) => (
          <CategoryChip
            key={category.slug}
            label={category.label}
            active={activeSlug === category.slug}
            onClick={() => onSelect(category.slug)}
          />
        ))}
      </div>
    </nav>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 shrink-0 rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
