import { siteConfig } from "@/lib/site";

export function productPath(slug: string): string {
  return `/product/${slug}`;
}

export function creatorPath(slug: string): string {
  return `/creator/${slug}`;
}

export function creatorStoreUrl(slug: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}${creatorPath(slug)}`;
}

export function creatorStoreHostPath(slug: string): string {
  try {
    const url = new URL(creatorStoreUrl(slug));
    return `${url.host}${url.pathname}`;
  } catch {
    return `lumen.app/creator/${slug}`;
  }
}

export function discoverCategoryPath(slug: string): string {
  return `/discover?category=${slug}`;
}
