import type { Product } from "@/types/catalog";

export function getRelatedProducts(
  product: Product,
  catalog: Product[],
  limit = 4,
): Product[] {
  const ranked = catalog
    .filter((item) => item.id !== product.id)
    .map((item) => {
      let score = 0;
      if (item.categorySlug === product.categorySlug) score += 3;
      if (item.productType === product.productType) score += 2;
      if (item.creator.slug === product.creator.slug) score += 2;
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || b.item.salesCount - a.item.salesCount,
    );

  const picked = ranked.slice(0, limit).map((entry) => entry.item);
  if (picked.length >= limit) return picked;

  const fill = catalog
    .filter(
      (item) =>
        item.id !== product.id && !picked.some((row) => row.id === item.id),
    )
    .sort((a, b) => b.salesCount - a.salesCount);

  return [...picked, ...fill].slice(0, limit);
}
