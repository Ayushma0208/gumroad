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
  StudioProductStatus,
  StudioSale,
  StudioSettings,
} from "@/types/studio";

/**
 * Creator studio API.
 * Currently backed by the in-memory mock in `lib/mock/studio-db.ts`.
 * Replace these functions with `fetch(`${API}/studio/...`, { credentials: "include" })`
 * when the Express studio module is live.
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
  await delay();
  return listStudioProducts(userId);
}

export async function fetchStudioProduct(
  userId: string,
  productId: string,
): Promise<StudioProduct | null> {
  await delay(220);
  return getStudioProduct(userId, productId);
}

export async function saveStudioProduct(input: {
  userId: string;
  draft: StudioProductDraft;
  status: StudioProductStatus;
  productId?: string;
}): Promise<StudioProduct> {
  await delay(480);
  return upsertStudioProduct(
    input.userId,
    input.draft,
    input.status,
    input.productId,
  );
}

export async function duplicateProduct(input: {
  userId: string;
  productId: string;
}): Promise<StudioProduct | null> {
  await delay(280);
  return duplicateStudioProduct(input.userId, input.productId);
}

export async function archiveProduct(input: {
  userId: string;
  productId: string;
}): Promise<StudioProduct | null> {
  await delay(220);
  return archiveStudioProduct(input.userId, input.productId);
}

export async function removeProduct(input: {
  userId: string;
  productId: string;
}): Promise<boolean> {
  await delay(220);
  return deleteStudioProduct(input.userId, input.productId);
}

export async function updateProductStatus(input: {
  userId: string;
  productId: string;
  status: StudioProductStatus;
}): Promise<StudioProduct | null> {
  await delay(280);
  return setStudioProductStatus(input.userId, input.productId, input.status);
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
