import type { Product, ProductType } from "@/types/catalog";

export const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const PRICE_FILTERS = [
  { value: "under-30", label: "Under $30" },
  { value: "30-70", label: "$30 – $70" },
  { value: "70-plus", label: "$70 and up" },
] as const;

export type PriceFilter = (typeof PRICE_FILTERS)[number]["value"];

export const RATING_FILTERS = [
  { value: "4.5", label: "4.5 and up" },
  { value: "4.8", label: "4.8 and up" },
] as const;

export type RatingFilter = (typeof RATING_FILTERS)[number]["value"];

export const PRODUCT_TYPE_FILTERS = [
  { value: "kit", label: "Kits & systems" },
  { value: "course", label: "Courses" },
  { value: "pack", label: "Packs & presets" },
  { value: "template", label: "Templates" },
  { value: "ebook", label: "Ebooks & guides" },
] as const;

export type CatalogFilters = {
  q: string;
  category: string | null;
  sort: SortKey;
  price: PriceFilter | null;
  rating: RatingFilter | null;
  type: ProductType | null;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  q: "",
  category: null,
  sort: "popular",
  price: null,
  rating: null,
  type: null,
};

export const SEARCH_SUGGESTIONS = [
  "Prompt engineering",
  "UI kit",
  "Lightroom",
  "Notion",
  "React",
] as const;

function isSortKey(value: string | null): value is SortKey {
  return SORT_OPTIONS.some((option) => option.value === value);
}

function isPriceFilter(value: string | null): value is PriceFilter {
  return PRICE_FILTERS.some((option) => option.value === value);
}

function isRatingFilter(value: string | null): value is RatingFilter {
  return RATING_FILTERS.some((option) => option.value === value);
}

function isProductType(value: string | null): value is ProductType {
  return PRODUCT_TYPE_FILTERS.some((option) => option.value === value);
}

export function parseCatalogFilters(
  params: Pick<URLSearchParams, "get">,
): CatalogFilters {
  const sortParam = params.get("sort");
  const priceParam = params.get("price");
  const ratingParam = params.get("rating");
  const typeParam = params.get("type");

  return {
    q: params.get("q")?.trim() ?? "",
    category: params.get("category")?.trim() || null,
    sort: isSortKey(sortParam) ? sortParam : "popular",
    price: isPriceFilter(priceParam) ? priceParam : null,
    rating: isRatingFilter(ratingParam) ? ratingParam : null,
    type: isProductType(typeParam) ? typeParam : null,
  };
}

export function catalogFiltersToQueryString(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  const query = filters.q.trim();
  if (query) params.set("q", query);
  if (filters.category) params.set("category", filters.category);
  if (filters.sort !== "popular") params.set("sort", filters.sort);
  if (filters.price) params.set("price", filters.price);
  if (filters.rating) params.set("rating", filters.rating);
  if (filters.type) params.set("type", filters.type);
  return params.toString();
}

export function hasActiveBrowseFilters(filters: CatalogFilters): boolean {
  return Boolean(filters.q || filters.price || filters.rating || filters.type);
}

export function countExtraFilters(filters: CatalogFilters): number {
  return [filters.price, filters.rating, filters.type].filter(Boolean).length;
}

function matchesPrice(product: Product, price: PriceFilter): boolean {
  if (price === "under-30") return product.priceCents < 3000;
  if (price === "30-70") {
    return product.priceCents >= 3000 && product.priceCents <= 7000;
  }
  return product.priceCents > 7000;
}

function matchesQuery(product: Product, query: string): boolean {
  if (!query) return true;
  const haystack = [
    product.title,
    product.subtitle,
    product.creator.name,
    product.categoryLabel,
    product.categorySlug,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function queryCatalog(
  products: Product[],
  filters: CatalogFilters,
): Product[] {
  const query = filters.q.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (query && !matchesQuery(product, query)) return false;
    if (filters.category && product.categorySlug !== filters.category) {
      return false;
    }
    if (filters.type && product.productType !== filters.type) return false;
    if (filters.price && !matchesPrice(product, filters.price)) return false;
    if (filters.rating === "4.5" && product.rating < 4.5) return false;
    if (filters.rating === "4.8" && product.rating < 4.8) return false;
    return true;
  });

  const sorted = [...filtered];
  switch (filters.sort) {
    case "newest":
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "price-asc":
      sorted.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.priceCents - a.priceCents);
      break;
    default:
      sorted.sort((a, b) => b.salesCount - a.salesCount);
  }

  return sorted;
}

export type CatalogSpotlight = {
  lead: Product;
  supporting: Product[];
};

function spotlightRank(product: Product): number {
  return (
    Number(Boolean(product.editorsPick)) * 4 +
    Number(Boolean(product.trending)) * 2 +
    Number(Boolean(product.featured))
  );
}

export function getCatalogSpotlight(
  products: Product[],
  category: string | null,
): CatalogSpotlight | null {
  const inCategory = (product: Product) =>
    !category || product.categorySlug === category;

  const curated = products.filter(
    (product) =>
      inCategory(product) &&
      (product.trending || product.editorsPick || product.featured),
  );

  const pool =
    curated.length >= 2
      ? curated
      : [...products]
          .filter(inCategory)
          .sort((a, b) => b.salesCount - a.salesCount)
          .slice(0, 4);

  if (pool.length === 0) return null;

  const ranked = [...pool].sort(
    (a, b) => spotlightRank(b) - spotlightRank(a) || b.salesCount - a.salesCount,
  );
  const [lead, ...rest] = ranked;
  if (!lead) return null;

  return { lead, supporting: rest.slice(0, 3) };
}

export function getDiscoverHeading(
  filters: CatalogFilters,
  categoryLabel: string | null,
): { title: string; kicker: string } {
  if (filters.q) {
    return {
      title: `Results for “${filters.q}”`,
      kicker: categoryLabel ? categoryLabel : "Search",
    };
  }
  if (categoryLabel) {
    return { title: categoryLabel, kicker: "Explore" };
  }
  return { title: "Explore products", kicker: "The catalog" };
}

export function optionLabel<T extends string>(
  options: readonly { value: T; label: string }[],
  value: T | null,
): string | null {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? null;
}
