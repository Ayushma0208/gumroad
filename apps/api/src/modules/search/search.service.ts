import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  paginationMeta,
  parsePagination,
} from "../../utils/pagination";
import { serializePublicCreator } from "../creators/creator.types";
import {
  listPublishedProducts,
  productListInclude,
} from "../products/product.service";
import {
  loadReviewStatsForProducts,
  serializeProductList,
} from "../products/product.types";
import type { SearchQuery, SuggestQuery } from "./search.schema";

/** Deterministic relevance: higher is better. Testable scoring. */
export function scoreProductRelevance(
  query: string,
  product: {
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    creator: { storeName: string; displayName: string; slug: string };
    category: { label: string; slug: string };
    productType: string;
  },
) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const title = product.title.toLowerCase();
  const slug = product.slug.toLowerCase();
  const short = product.shortDescription.toLowerCase();
  const desc = product.description.toLowerCase();
  const store = product.creator.storeName.toLowerCase();
  const display = product.creator.displayName.toLowerCase();
  const creatorSlug = product.creator.slug.toLowerCase();
  const category = product.category.label.toLowerCase();
  const categorySlug = product.category.slug.toLowerCase();
  const type = product.productType.toLowerCase().replace(/_/g, " ");

  let score = 0;

  // Title/slug — exclusive tiers (exact always beats partial + secondary matches).
  if (title === q || slug === q) score += 2000;
  else if (title.startsWith(q) || slug.startsWith(q)) score += 1200;
  else if (title.includes(q) || slug.includes(q)) score += 700;

  if (store === q || display === q || creatorSlug === q) score += 400;
  else if (
    store.startsWith(q) ||
    display.startsWith(q) ||
    creatorSlug.startsWith(q)
  ) {
    score += 300;
  } else if (store.includes(q) || display.includes(q) || creatorSlug.includes(q)) {
    score += 220;
  }

  if (category === q || categorySlug === q) score += 180;
  else if (category.includes(q) || categorySlug.includes(q)) score += 120;

  if (type.includes(q)) score += 80;
  if (short.includes(q)) score += 50;
  if (desc.includes(q)) score += 25;

  return score;
}

function productSearchWhere(q: string): Prisma.ProductWhereInput {
  return {
    status: "PUBLISHED",
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { shortDescription: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { creator: { storeName: { contains: q, mode: "insensitive" } } },
      { creator: { displayName: { contains: q, mode: "insensitive" } } },
      { creator: { slug: { contains: q, mode: "insensitive" } } },
      { category: { label: { contains: q, mode: "insensitive" } } },
      { category: { slug: { contains: q, mode: "insensitive" } } },
    ],
  };
}

/** Slim fields for in-memory relevance scoring — no images/files/reviews. */
const relevanceCandidateSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  description: true,
  productType: true,
  creator: {
    select: { storeName: true, displayName: true, slug: true },
  },
  category: { select: { label: true, slug: true } },
  _count: {
    select: {
      orderItems: { where: { order: { status: "PAID" as const } } },
    },
  },
} satisfies Prisma.ProductSelect;

/**
 * Unified marketplace search: products (paginated) + creator/category hits.
 * Product listing reuses listPublishedProducts filters when not scoring relevance.
 */
export async function searchMarketplace(query: SearchQuery) {
  const q = (query.q ?? query.search)?.trim() || undefined;
  const sort = query.sort ?? (q ? "relevance" : "popular");
  const pagination = parsePagination(query.page, query.limit ?? 24);

  const productFilters = {
    search: q,
    q,
    category: query.category,
    productType: query.productType,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    minRating: query.minRating,
    sort: sort === "relevance" && !q ? "popular" : sort,
    creatorSlug: query.creator,
    page: query.page,
    limit: query.limit ?? 24,
  };

  let products;
  if (q && (sort === "relevance" || !query.sort)) {
    products = await listProductsByRelevance({
      q,
      category: query.category,
      productType: query.productType,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      minRating: query.minRating,
      creatorSlug: query.creator,
      page: pagination.page,
      limit: pagination.limit,
    });
  } else {
    products = await listPublishedProducts(productFilters);
  }

  const [creators, categories] = q
    ? await Promise.all([
        searchCreators(q, 6),
        searchCategories(q, 6),
      ])
    : [[], []];

  return {
    query: q ?? "",
    products: products.items,
    creators,
    categories,
    pagination: products.pagination,
  };
}

async function listProductsByRelevance(input: {
  q: string;
  category?: string;
  productType?: SearchQuery["productType"];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  creatorSlug?: string;
  page: number;
  limit: number;
}) {
  const where: Prisma.ProductWhereInput = {
    ...productSearchWhere(input.q),
    ...(input.creatorSlug ? { creator: { slug: input.creatorSlug } } : {}),
    ...(input.category ? { category: { slug: input.category } } : {}),
    ...(input.productType ? { productType: input.productType } : {}),
    ...(input.minPrice !== undefined || input.maxPrice !== undefined
      ? {
          price: {
            ...(input.minPrice !== undefined ? { gte: input.minPrice } : {}),
            ...(input.maxPrice !== undefined ? { lte: input.maxPrice } : {}),
          },
        }
      : {}),
  };

  // Cap candidate set for scoring; hydrate only the page slice for cards.
  const candidates = await prisma.product.findMany({
    where,
    select: relevanceCandidateSelect,
    take: 250,
  });

  let ranked = candidates
    .map((product) => ({
      id: product.id,
      score: scoreProductRelevance(input.q, product),
      sales: product._count.orderItems,
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || b.sales - a.sales);

  if (input.minRating && input.minRating > 0) {
    const stats = await loadReviewStatsForProducts(ranked.map((row) => row.id));
    ranked = ranked.filter((row) => {
      const review = stats.get(row.id);
      return Boolean(review && review.rating >= (input.minRating ?? 0));
    });
  }

  const total = ranked.length;
  const pageIds = ranked
    .slice((input.page - 1) * input.limit, input.page * input.limit)
    .map((row) => row.id);

  if (pageIds.length === 0) {
    return {
      items: [],
      pagination: paginationMeta(input.page, input.limit, total),
    };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: pageIds } },
    include: productListInclude,
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  const ordered = pageIds
    .map((id) => byId.get(id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  return {
    items: await serializeProductList(ordered),
    pagination: paginationMeta(input.page, input.limit, total),
  };
}

export async function searchCreators(q: string, limit = 6) {
  const profiles = await prisma.creatorProfile.findMany({
    where: {
      OR: [
        { storeName: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ],
      products: { some: { status: "PUBLISHED" } },
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      _count: {
        select: { products: { where: { status: "PUBLISHED" } } },
      },
    },
    take: Math.min(limit, 12),
    orderBy: { storeName: "asc" },
  });

  return profiles.map((profile) => ({
    ...serializePublicCreator(profile),
    productCount: profile._count.products,
  }));
}

export async function searchCategories(q: string, limit = 6) {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      OR: [
        { label: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { sortOrder: "asc" },
    take: Math.min(limit, 12),
  });

  if (categories.length === 0) return [];

  const counts = await prisma.product.groupBy({
    by: ["categoryId"],
    where: {
      status: "PUBLISHED",
      categoryId: { in: categories.map((category) => category.id) },
    },
    _count: { _all: true },
  });
  const countMap = new Map(
    counts.map((row) => [row.categoryId, row._count._all]),
  );

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    label: category.label,
    description: category.description,
    icon: category.icon,
    productCount: countMap.get(category.id) ?? 0,
  }));
}

export async function suggestSearch(query: SuggestQuery) {
  const q = query.q.trim();
  const limit = query.limit ?? 5;
  if (q.length < 2) {
    return { query: q, products: [], creators: [], categories: [] };
  }

  const [products, creators, categories] = await Promise.all([
    prisma.product.findMany({
      where: productSearchWhere(q),
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        price: true,
        currency: true,
        creator: { select: { storeName: true, slug: true } },
      },
      take: 40,
    }),
    searchCreators(q, limit),
    searchCategories(q, limit),
  ]);

  const rankedProducts = products
    .map((product) => ({
      product,
      score: scoreProductRelevance(q, {
        title: product.title,
        slug: product.slug,
        shortDescription: "",
        description: "",
        creator: {
          storeName: product.creator.storeName,
          displayName: product.creator.storeName,
          slug: product.creator.slug,
        },
        category: { label: "", slug: "" },
        productType: "",
      }),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      coverImage: product.coverImage,
      priceCents: product.price,
      currency: product.currency,
      creatorName: product.creator.storeName,
      creatorSlug: product.creator.slug,
      href: `/product/${product.slug}`,
    }));

  return {
    query: q,
    products: rankedProducts,
    creators: creators.slice(0, limit).map((creator) => ({
      id: creator.id,
      storeName: creator.storeName,
      displayName: creator.displayName,
      slug: creator.slug,
      avatar: creator.avatar,
      productCount: creator.productCount,
      href: `/creator/${creator.slug}`,
    })),
    categories: categories.slice(0, limit).map((category) => ({
      id: category.id,
      label: category.label,
      slug: category.slug,
      icon: category.icon,
      productCount: category.productCount,
      href: `/discover?category=${encodeURIComponent(category.slug)}`,
    })),
  };
}
