"use client";

import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  countExtraFilters,
  optionLabel,
  PRICE_FILTERS,
  PRODUCT_TYPE_FILTERS,
  RATING_FILTERS,
  SORT_OPTIONS,
  type CatalogFilters,
  type PriceFilter,
  type RatingFilter,
  type SortKey,
} from "@/lib/catalog/query";
import { cn } from "@/lib/utils";
import type { ProductType } from "@/types/catalog";

type DiscoverFiltersProps = {
  filters: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onClear: () => void;
};

export function DiscoverFilters({
  filters,
  onChange,
  onClear,
}: DiscoverFiltersProps) {
  const extra = countExtraFilters(filters);

  return (
    <>
      <div className="hidden items-center gap-2 md:flex">
        <FilterDropdown
          label="Price"
          value={filters.price ?? "any"}
          active={Boolean(filters.price)}
          onChange={(value) =>
            onChange({ price: value === "any" ? null : (value as PriceFilter) })
          }
          options={[
            { value: "any", label: "Any price" },
            ...PRICE_FILTERS,
          ]}
        />
        <FilterDropdown
          label="Type"
          value={filters.type ?? "any"}
          active={Boolean(filters.type)}
          onChange={(value) =>
            onChange({ type: value === "any" ? null : (value as ProductType) })
          }
          options={[
            { value: "any", label: "Any type" },
            ...PRODUCT_TYPE_FILTERS,
          ]}
        />
        <FilterDropdown
          label="Rating"
          value={filters.rating ?? "any"}
          active={Boolean(filters.rating)}
          onChange={(value) =>
            onChange({
              rating: value === "any" ? null : (value as RatingFilter),
            })
          }
          options={[
            { value: "any", label: "Any rating" },
            ...RATING_FILTERS,
          ]}
        />
        <SortDropdown
          value={filters.sort}
          onChange={(sort) => onChange({ sort })}
        />
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                className="h-11 rounded-full px-4"
              />
            }
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {extra > 0 ? (
              <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] text-background">
                {extra}
              </span>
            ) : null}
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[88vh] gap-0 rounded-t-3xl"
          >
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle className="font-display text-2xl tracking-tight">
                Filters
              </SheetTitle>
            </SheetHeader>
            <div className="no-scrollbar overflow-y-auto px-5 py-5">
              <MobileFilterGroup label="Sort by">
                <ChoiceList
                  value={filters.sort}
                  onChange={(value) => onChange({ sort: value as SortKey })}
                  options={SORT_OPTIONS}
                />
              </MobileFilterGroup>
              <MobileFilterGroup label="Price">
                <ChoiceList
                  value={filters.price ?? "any"}
                  onChange={(value) =>
                    onChange({
                      price: value === "any" ? null : (value as PriceFilter),
                    })
                  }
                  options={[
                    { value: "any", label: "Any price" },
                    ...PRICE_FILTERS,
                  ]}
                />
              </MobileFilterGroup>
              <MobileFilterGroup label="Product type">
                <ChoiceList
                  value={filters.type ?? "any"}
                  onChange={(value) =>
                    onChange({
                      type: value === "any" ? null : (value as ProductType),
                    })
                  }
                  options={[
                    { value: "any", label: "Any type" },
                    ...PRODUCT_TYPE_FILTERS,
                  ]}
                />
              </MobileFilterGroup>
              <MobileFilterGroup label="Rating">
                <ChoiceList
                  value={filters.rating ?? "any"}
                  onChange={(value) =>
                    onChange({
                      rating:
                        value === "any" ? null : (value as RatingFilter),
                    })
                  }
                  options={[
                    { value: "any", label: "Any rating" },
                    ...RATING_FILTERS,
                  ]}
                />
              </MobileFilterGroup>
            </div>
            <SheetFooter className="flex-row gap-2 border-t border-border">
              <Button
                variant="ghost"
                className="h-11 flex-1 rounded-xl"
                onClick={onClear}
                disabled={extra === 0 && filters.sort === "popular"}
              >
                Clear
              </Button>
              <SheetClose
                render={<Button className="h-11 flex-1 rounded-xl" />}
              >
                Show results
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <SortDropdown
          value={filters.sort}
          onChange={(sort) => onChange({ sort })}
        />
      </div>
    </>
  );
}

export function DiscoverActiveFilters({
  filters,
  onChange,
  onClear,
}: DiscoverFiltersProps) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  const priceLabel = optionLabel(PRICE_FILTERS, filters.price);
  if (filters.price && priceLabel) {
    chips.push({
      key: "price",
      label: priceLabel,
      onRemove: () => onChange({ price: null }),
    });
  }

  const typeLabel = optionLabel(PRODUCT_TYPE_FILTERS, filters.type);
  if (filters.type && typeLabel) {
    chips.push({
      key: "type",
      label: typeLabel,
      onRemove: () => onChange({ type: null }),
    });
  }

  const ratingLabel = optionLabel(RATING_FILTERS, filters.rating);
  if (filters.rating && ratingLabel) {
    chips.push({
      key: "rating",
      label: ratingLabel,
      onRemove: () => onChange({ rating: null }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs text-foreground"
        >
          {chip.label}
          <X className="size-3.5 text-muted-foreground" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="h-8 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Clear filters
      </button>
    </div>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (value: SortKey) => void;
}) {
  const current = SORT_OPTIONS.find((option) => option.value === value)?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 text-sm md:h-9",
          "hover:border-foreground/30 hover:text-foreground",
        )}
      >
        <span className="max-w-36 truncate">{current}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52 w-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => onChange(next as SortKey)}
          >
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilterDropdown({
  label,
  value,
  active,
  onChange,
  options,
}: {
  label: string;
  value: string;
  active: boolean;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors md:h-9",
          active
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background hover:border-foreground/30",
        )}
      >
        {label}
        <ChevronDown className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48 w-auto">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileFilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-7 last:mb-0">
      <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function ChoiceList({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-11 items-center justify-between rounded-xl px-3 text-left text-sm",
              selected ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
          >
            {option.label}
            {selected ? <Check className="size-4" /> : null}
          </button>
        );
      })}
    </div>
  );
}
