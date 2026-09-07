"use client";

import {
  FolderTree,
  Package,
  Search,
  Store,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useSearchSuggestions } from "@/hooks/use-search";
import {
  clearRecentSearches,
  pushRecentSearch,
  readRecentSearches,
} from "@/lib/catalog/recent-searches";
import { formatPrice } from "@/lib/format";
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

type FlatItem =
  | { kind: "recent"; label: string }
  | { kind: "product"; id: string; label: string; href: string }
  | { kind: "creator"; id: string; label: string; href: string }
  | { kind: "category"; id: string; label: string; href: string };

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-transparent font-semibold text-foreground">
        {text.slice(index, index + q.length)}
      </mark>
      {text.slice(index + q.length)}
    </>
  );
}

export function DiscoverSearch({
  value,
  onChange,
  onClear,
  onSubmitQuery,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onSubmitQuery?: (value: string) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentsVersion, setRecentsVersion] = useState(0);
  const suggestions = useSearchSuggestions(value, open);
  const modifier = useSyncExternalStore(
    subscribeModifier,
    getModifierSnapshot,
    getModifierServerSnapshot,
  );
  const recents = useMemo(() => {
    void recentsVersion;
    return readRecentSearches();
  }, [recentsVersion]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function refreshRecents() {
    setRecentsVersion((value) => value + 1);
  }

  const flatItems = useMemo(() => {
    const items: FlatItem[] = [];
    if (value.trim().length < 2) {
      for (const recent of recents) {
        items.push({ kind: "recent", label: recent });
      }
      return items;
    }
    for (const product of suggestions.data?.products ?? []) {
      items.push({
        kind: "product",
        id: product.id,
        label: product.title,
        href: product.href,
      });
    }
    for (const creator of suggestions.data?.creators ?? []) {
      items.push({
        kind: "creator",
        id: creator.id,
        label: creator.storeName,
        href: creator.href,
      });
    }
    for (const category of suggestions.data?.categories ?? []) {
      items.push({
        kind: "category",
        id: category.id,
        label: category.label,
        href: category.href,
      });
    }
    return items;
  }, [recents, suggestions.data, value]);

  function commitSearch(term: string) {
    const next = term.trim();
    if (next.length >= 2) {
      pushRecentSearch(next);
      refreshRecents();
    }
    onSubmitQuery?.(next);
    setOpen(false);
    setActiveIndex(-1);
  }

  function activateItem(item: FlatItem) {
    if (item.kind === "recent") {
      onChange(item.label);
      commitSearch(item.label);
      return;
    }
    pushRecentSearch(value.trim() || item.label);
    refreshRecents();
    setOpen(false);
    router.push(item.href);
  }

  const showPanel =
    open &&
    (value.trim().length >= 2 ||
      recents.length > 0 ||
      suggestions.isFetching);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-muted-foreground sm:left-5 sm:size-[1.15rem]" />
      <input
        ref={inputRef}
        id="discover-search"
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            setActiveIndex(-1);
            inputRef.current?.blur();
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) =>
              Math.min(current + 1, flatItems.length - 1),
            );
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, -1));
            return;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            if (activeIndex >= 0 && flatItems[activeIndex]) {
              activateItem(flatItems[activeIndex]);
              return;
            }
            commitSearch(value);
          }
        }}
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
          onClick={() => {
            onClear();
            setOpen(false);
            setActiveIndex(-1);
          }}
          className="absolute top-1/2 right-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:right-4"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 items-center gap-0.5 rounded-lg border border-border bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground sm:inline-flex">
          {modifier}K
        </kbd>
      )}

      {showPanel ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close search suggestions"
            onClick={() => setOpen(false)}
          />
          <div
            id={listboxId}
            role="listbox"
            aria-label="Search suggestions"
            className={cn(
              "absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-border bg-background shadow-lg",
              "max-sm:fixed max-sm:inset-x-3 max-sm:top-24 max-sm:max-h-[min(70vh,28rem)]",
            )}
          >
            <div className="max-h-[min(70vh,28rem)] overflow-y-auto">
              {value.trim().length < 2 ? (
                <RecentSection
                  recents={recents}
                  activeIndex={activeIndex}
                  listboxId={listboxId}
                  onPick={(term) => {
                    onChange(term);
                    commitSearch(term);
                  }}
                  onClear={() => {
                    clearRecentSearches();
                    refreshRecents();
                  }}
                />
              ) : suggestions.isPending && !suggestions.data ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  Searching…
                </p>
              ) : flatItems.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  No matches. Press Enter to search the catalog.
                </p>
              ) : (
                <SuggestionGroups
                  data={suggestions.data}
                  query={value}
                  activeIndex={activeIndex}
                  listboxId={listboxId}
                  flatItems={flatItems}
                  onActivate={activateItem}
                />
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function RecentSection({
  recents,
  activeIndex,
  listboxId,
  onPick,
  onClear,
}: {
  recents: string[];
  activeIndex: number;
  listboxId: string;
  onPick: (term: string) => void;
  onClear: () => void;
}) {
  if (recents.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        Type at least 2 characters to see suggestions.
      </p>
    );
  }
  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Recent
        </p>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <ul>
        {recents.map((term, index) => (
          <li key={term}>
            <button
              type="button"
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/60",
                activeIndex === index && "bg-muted/60",
              )}
              onClick={() => onPick(term)}
            >
              <Search className="size-4 text-muted-foreground" />
              {term}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuggestionGroups({
  data,
  query,
  activeIndex,
  listboxId,
  flatItems,
  onActivate,
}: {
  data: ReturnType<typeof useSearchSuggestions>["data"];
  query: string;
  activeIndex: number;
  listboxId: string;
  flatItems: FlatItem[];
  onActivate: (item: FlatItem) => void;
}) {
  let offset = 0;
  return (
    <div className="py-2">
      {(data?.products.length ?? 0) > 0 ? (
        <Group title="Products" icon={<Package className="size-3.5" />}>
          {data!.products.map((product) => {
            const index = offset++;
            const item = flatItems[index];
            return (
              <button
                key={product.id}
                type="button"
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60",
                  activeIndex === index && "bg-muted/60",
                )}
                onClick={() => item && onActivate(item)}
              >
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {product.coverImage ? (
                    <Image
                      src={product.coverImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {highlightMatch(product.title, query)}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {product.creatorName} ·{" "}
                    {formatPrice(product.priceCents, product.currency)}
                  </span>
                </span>
              </button>
            );
          })}
        </Group>
      ) : null}

      {(data?.creators.length ?? 0) > 0 ? (
        <Group title="Creators" icon={<Store className="size-3.5" />}>
          {data!.creators.map((creator) => {
            const index = offset++;
            const item = flatItems[index];
            return (
              <button
                key={creator.id}
                type="button"
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60",
                  activeIndex === index && "bg-muted/60",
                )}
                onClick={() => item && onActivate(item)}
              >
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {creator.avatar ? (
                    <Image
                      src={creator.avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 object-cover"
                    />
                  ) : (
                    <Store className="size-4 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {highlightMatch(creator.storeName, query)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {creator.productCount} products
                  </span>
                </span>
              </button>
            );
          })}
        </Group>
      ) : null}

      {(data?.categories.length ?? 0) > 0 ? (
        <Group title="Categories" icon={<FolderTree className="size-3.5" />}>
          {data!.categories.map((category) => {
            const index = offset++;
            const item = flatItems[index];
            return (
              <button
                key={category.id}
                type="button"
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60",
                  activeIndex === index && "bg-muted/60",
                )}
                onClick={() => item && onActivate(item)}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FolderTree className="size-4 text-muted-foreground" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {highlightMatch(category.label, query)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {category.productCount} products
                  </span>
                </span>
              </button>
            );
          })}
        </Group>
      ) : null}
    </div>
  );
}

function Group({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <p className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}
