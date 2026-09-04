import { requestJson } from "@/lib/api/http";
import type { Category, CategoryIcon, Product, ProductType } from "@/types/catalog";

type ApiCategory = {
  id: string;
  slug: string;
  label: string;
  description: string;
  imageUrl: string;
  icon: string;
  productCount: number;
};

type ApiProduct = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  priceCents: number;
  currency: "USD" | "INR";
  productType: string;
  coverImage: string;
  featured?: boolean;
  trending?: boolean;
  editorsPick?: boolean;
  createdAt: string;
  category: { slug: string; label: string };
  creator: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string;
    headline?: string;
  };
  images?: string[];
  rating: number;
  reviewCount: number;
  salesCount: number;
};

function mapProductType(type: string): ProductType {
  if (type === "COURSE") return "course";
  if (type === "TEMPLATE") return "template";
  if (type === "BUNDLE") return "pack";
  return "kit";
}

function mapIcon(icon: string): CategoryIcon {
  const allowed: CategoryIcon[] = [
    "design",
    "development",
    "ai",
    "business",
    "photography",
    "music",
    "education",
    "writing",
    "productivity",
  ];
  return allowed.includes(icon as CategoryIcon) ? (icon as CategoryIcon) : "design";
}

export function mapApiProduct(product: ApiProduct): Product {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.shortDescription,
    description: product.description,
    priceCents: product.priceCents,
    currency: product.currency,
    imageUrl: product.coverImage,
    categorySlug: product.category.slug,
    categoryLabel: product.category.label,
    productType: mapProductType(product.productType),
    createdAt: product.createdAt.slice(0, 10),
    rating: product.rating,
    reviewCount: product.reviewCount,
    salesCount: product.salesCount,
    featured: product.featured,
    trending: product.trending,
    editorsPick: product.editorsPick,
    creator: {
      id: product.creator.id,
      name: product.creator.name,
      slug: product.creator.slug,
      avatarUrl: product.creator.avatarUrl,
      headline: product.creator.headline,
    },
  };
}

export async function fetchRemoteCategories(): Promise<Category[]> {
  const data = await requestJson<{ categories: ApiCategory[] }>(
    "/api/v1/categories",
  );
  return data.categories.map((category) => ({
    slug: category.slug,
    label: category.label,
    description: category.description,
    imageUrl: category.imageUrl,
    productCount: category.productCount,
    icon: mapIcon(category.icon),
  }));
}

export async function fetchRemoteProducts(): Promise<Product[]> {
  const data = await requestJson<{ products: ApiProduct[] }>("/api/v1/products");
  return data.products.map(mapApiProduct);
}

export async function fetchRemoteProductBySlug(
  slug: string,
): Promise<ApiProduct | null> {
  try {
    const data = await requestJson<{ product: ApiProduct }>(
      `/api/v1/products/${slug}`,
    );
    return data.product;
  } catch {
    return null;
  }
}
