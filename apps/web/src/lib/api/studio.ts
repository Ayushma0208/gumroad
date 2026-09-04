import { ApiError } from "@/lib/api/client";
import {
  fetchRemoteCategories,
  type ApiProduct,
} from "@/lib/api/catalog";
import { requestJson } from "@/lib/api/http";
import {
  archiveStudioProduct,
  delay,
  deleteStudioProduct,
  duplicateStudioProduct,
  getStudioAnalytics,
  getStudioOverview,
  getStudioProduct,
  getStudioSettings,
  listStudioCustomers,
  listStudioProducts,
  listStudioSales,
  saveStudioSettings,
  setStudioProductStatus,
  upsertStudioProduct,
} from "@/lib/mock/studio-db";
import type {
  StudioAnalytics,
  StudioCustomer,
  StudioOverview,
  StudioProduct,
  StudioProductDraft,
  StudioProductKind,
  StudioProductStatus,
  StudioSale,
  StudioSettings,
} from "@/types/studio";

function isAuthMiss(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function kindFromType(type: string): StudioProductKind {
  if (type === "COURSE") return "course";
  if (type === "TEMPLATE") return "template";
  if (type === "BUNDLE") return "bundle";
  return "download";
}

function typeFromKind(kind: StudioProductKind) {
  if (kind === "course") return "COURSE";
  if (kind === "template") return "TEMPLATE";
  if (kind === "bundle") return "BUNDLE";
  return "DIGITAL_DOWNLOAD";
}

function statusFromApi(status?: string): StudioProductStatus {
  if (status === "PUBLISHED") return "published";
  if (status === "ARCHIVED") return "archived";
  return "draft";
}

function publicCover(url: string) {
  if (url.startsWith("blob:")) {
    return "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1600&q=80";
  }
  return url;
}

function mapStudioProduct(product: ApiProduct & { updatedAt?: string }): StudioProduct {
  const priceCents =
    product.priceCents ?? Math.round((product.price ?? 0) * 100);
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    shortDescription: product.shortDescription,
    description: product.description,
    kind: kindFromType(product.productType),
    categorySlug: product.category.slug,
    categoryLabel: product.category.label ?? product.category.name ?? product.category.slug,
    coverUrl: product.coverImage,
    gallery: product.images ?? [],
    files: (product.files ?? []).map((file) => ({
      id: file.id,
      name: file.fileName,
      sizeBytes: file.fileSize,
      mimeType: file.mimeType,
    })),
    status: statusFromApi(product.status),
    pricingModel: priceCents === 0 ? "free" : "fixed",
    priceCents,
    currency: product.currency,
    salesCount: product.salesCount,
    revenueCents: 0,
    views: 0,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt ?? product.createdAt,
  };
}

async function categoryIdForSlug(slug: string) {
  const categories = await fetchRemoteCategories();
  const match = categories.find((category) => category.slug === slug);
  if (!match?.id) {
    throw new ApiError(400, "Pick a category from the list.");
  }
  return match.id;
}

function productPayload(draft: StudioProductDraft, status: StudioProductStatus) {
  return {
    title: draft.title,
    shortDescription: draft.shortDescription,
    description: draft.description,
    categoryId: undefined as string | undefined,
    price: draft.pricingModel === "free" ? 0 : draft.priceCents,
    currency: draft.currency,
    productType: typeFromKind(draft.kind),
    coverImage: publicCover(draft.coverUrl),
    images: [publicCover(draft.coverUrl), ...draft.gallery]
      .filter((url, index, list) => url && !url.startsWith("blob:") && list.indexOf(url) === index)
      .map((url, sortOrder) => ({ url, sortOrder })),
    status:
      status === "published"
        ? "PUBLISHED"
        : status === "archived"
          ? "ARCHIVED"
          : "DRAFT",
  };
}

/**
 * Studio reads still use the mock for sales, customers, analytics, and settings.
 * Product CRUD prefers Express `/api/v1/products` and falls back to the mock
 * when the session is the Next.js mock cookie (not a JWT).
 */

export async function fetchStudioOverview(
  userId: string,
): Promise<StudioOverview> {
  await delay();
  return getStudioOverview(userId);
}

export async function fetchStudioProducts(
  userId: string,
): Promise<StudioProduct[]> {
  try {
    const data = await requestJson<{ items: ApiProduct[] }>(
      "/api/v1/products/my?limit=48",
    );
    return data.items.map(mapStudioProduct);
  } catch (error) {
    if (!isAuthMiss(error) && error instanceof ApiError) throw error;
    await delay();
    return listStudioProducts(userId);
  }
}

export async function fetchStudioProduct(
  userId: string,
  productId: string,
): Promise<StudioProduct | null> {
  try {
    const data = await requestJson<{ product: ApiProduct }>(
      `/api/v1/products/${encodeURIComponent(productId)}`,
    );
    return mapStudioProduct(data.product);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    if (!isAuthMiss(error) && error instanceof ApiError) throw error;
    await delay(220);
    return getStudioProduct(userId, productId);
  }
}

export async function saveStudioProduct(input: {
  userId: string;
  draft: StudioProductDraft;
  status: StudioProductStatus;
  productId?: string;
}): Promise<StudioProduct> {
  try {
    const payload = productPayload(input.draft, input.status);
    payload.categoryId = await categoryIdForSlug(input.draft.categorySlug);
    if (input.productId) {
      const data = await requestJson<{ product: ApiProduct }>(
        `/api/v1/products/${encodeURIComponent(input.productId)}`,
        { method: "PATCH", body: payload },
      );
      return mapStudioProduct(data.product);
    }
    const data = await requestJson<{ product: ApiProduct }>(
      "/api/v1/products",
      { method: "POST", body: payload },
    );
    return mapStudioProduct(data.product);
  } catch (error) {
    if (!isAuthMiss(error) && error instanceof ApiError) throw error;
    await delay(480);
    return upsertStudioProduct(
      input.userId,
      input.draft,
      input.status,
      input.productId,
    );
  }
}

export async function duplicateProduct(input: {
  userId: string;
  productId: string;
}): Promise<StudioProduct | null> {
  try {
    const existing = await fetchStudioProduct(input.userId, input.productId);
    if (!existing) return null;
    return saveStudioProduct({
      userId: input.userId,
      status: "draft",
      draft: {
        kind: existing.kind,
        title: `${existing.title} (copy)`,
        shortDescription: existing.shortDescription,
        description: existing.description,
        categorySlug: existing.categorySlug,
        coverUrl: existing.coverUrl,
        gallery: existing.gallery,
        files: existing.files,
        pricingModel: existing.pricingModel,
        currency: existing.currency,
        priceCents: existing.priceCents,
        suggestedPriceCents: existing.suggestedPriceCents ?? existing.priceCents,
        minPriceCents: existing.minPriceCents ?? 0,
      },
    });
  } catch {
    await delay(280);
    return duplicateStudioProduct(input.userId, input.productId);
  }
}

export async function archiveProduct(input: {
  userId: string;
  productId: string;
}): Promise<StudioProduct | null> {
  try {
    const data = await requestJson<{ product: ApiProduct }>(
      `/api/v1/products/${encodeURIComponent(input.productId)}/archive`,
      { method: "POST" },
    );
    return mapStudioProduct(data.product);
  } catch (error) {
    if (!isAuthMiss(error) && error instanceof ApiError) throw error;
    await delay(220);
    return archiveStudioProduct(input.userId, input.productId);
  }
}

export async function removeProduct(input: {
  userId: string;
  productId: string;
}): Promise<boolean> {
  try {
    await requestJson(`/api/v1/products/${encodeURIComponent(input.productId)}`, {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    if (!isAuthMiss(error) && error instanceof ApiError) throw error;
    await delay(220);
    return deleteStudioProduct(input.userId, input.productId);
  }
}

export async function updateProductStatus(input: {
  userId: string;
  productId: string;
  status: StudioProductStatus;
}): Promise<StudioProduct | null> {
  try {
    const path =
      input.status === "published"
        ? "publish"
        : input.status === "archived"
          ? "archive"
          : null;
    if (path) {
      const data = await requestJson<{ product: ApiProduct }>(
        `/api/v1/products/${encodeURIComponent(input.productId)}/${path}`,
        { method: "POST" },
      );
      return mapStudioProduct(data.product);
    }
    const data = await requestJson<{ product: ApiProduct }>(
      `/api/v1/products/${encodeURIComponent(input.productId)}`,
      { method: "PATCH", body: { status: "DRAFT" } },
    );
    return mapStudioProduct(data.product);
  } catch (error) {
    if (!isAuthMiss(error) && error instanceof ApiError) throw error;
    await delay(280);
    return setStudioProductStatus(input.userId, input.productId, input.status);
  }
}

export async function fetchStudioSales(userId: string): Promise<StudioSale[]> {
  await delay();
  return listStudioSales(userId);
}

export async function fetchStudioCustomers(
  userId: string,
): Promise<StudioCustomer[]> {
  await delay();
  return listStudioCustomers(userId);
}

export async function fetchStudioAnalytics(
  userId: string,
): Promise<StudioAnalytics> {
  await delay();
  return getStudioAnalytics(userId);
}

export async function fetchStudioSettings(
  userId: string,
): Promise<StudioSettings> {
  await delay(200);
  return getStudioSettings(userId);
}

export async function updateStudioSettings(input: {
  userId: string;
  settings: StudioSettings;
}): Promise<StudioSettings> {
  await delay(420);
  return saveStudioSettings(input.userId, input.settings);
}

export async function deactivateStore(userId: string): Promise<StudioSettings> {
  await delay(500);
  const current = getStudioSettings(userId);
  return saveStudioSettings(userId, {
    ...current,
    storeDescription: `${current.storeDescription} (archived)`,
  });
}
