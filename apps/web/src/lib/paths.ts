export function productPath(slug: string): string {
  return `/product/${slug}`;
}

export function creatorPath(slug: string): string {
  return `/creators/${slug}`;
}

export function discoverCategoryPath(slug: string): string {
  return `/discover?category=${slug}`;
}
