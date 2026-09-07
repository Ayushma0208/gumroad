import { requestJson } from "@/lib/api/http";
import type { AdminOverview, AdminListMeta, AdminRangeParams } from "@/types/admin";

function rangeQuery(params?: AdminRangeParams) {
  const search = new URLSearchParams();
  if (!params) return "";
  if (params.range === "custom" && params.from && params.to) {
    search.set("from", params.from);
    search.set("to", params.to);
  } else {
    search.set("range", params.range);
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}

export async function fetchAdminOverview(params?: AdminRangeParams) {
  return requestJson<AdminOverview>(
    `/api/v1/admin/analytics/overview${rangeQuery(params)}`,
  );
}

export async function fetchAdminUsers(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  return requestJson<{ items: AdminUser[]; meta: AdminListMeta }>(
    `/api/v1/admin/users?${search.toString()}`,
  );
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED";
  avatarUrl: string | null;
  createdAt: string;
  orderCount: number;
  purchaseCount: number;
  creatorProfile: { id: string; storeName: string; slug: string } | null;
};

export async function fetchAdminUser(userId: string) {
  return requestJson<{ user: AdminUser & { reviewCount?: number; updatedAt?: string } }>(
    `/api/v1/admin/users/${encodeURIComponent(userId)}`,
  );
}

export async function updateAdminUserStatus(
  userId: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  return requestJson<{ user: AdminUser }>(
    `/api/v1/admin/users/${encodeURIComponent(userId)}/status`,
    { method: "PATCH", body: { status } },
  );
}

export async function fetchAdminCreators(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  return requestJson<{ items: AdminCreator[]; meta: AdminListMeta }>(
    `/api/v1/admin/creators?${search.toString()}`,
  );
}

export type AdminCreator = {
  id: string;
  displayName: string;
  storeName: string;
  slug: string;
  avatar: string | null;
  email: string;
  userId: string;
  status: "ACTIVE" | "SUSPENDED";
  productCount: number;
  publishedProductCount: number;
  revenueCents: number;
  salesCount: number;
  orderCount: number;
  joinedAt: string;
};

export async function fetchAdminCreator(creatorId: string) {
  return requestJson<{ creator: AdminCreator & Record<string, unknown> }>(
    `/api/v1/admin/creators/${encodeURIComponent(creatorId)}`,
  );
}

export async function fetchAdminProducts(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  return requestJson<{ items: AdminProduct[]; meta: AdminListMeta }>(
    `/api/v1/admin/products?${search.toString()}`,
  );
}

export type AdminProduct = {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: "USD" | "INR";
  productType: string;
  status: string;
  coverImage: string;
  creator: { id: string; storeName: string; slug: string };
  category: { id: string; label: string; slug: string };
  salesCount: number;
  createdAt: string;
  updatedAt: string;
};

export async function fetchAdminProduct(productId: string) {
  return requestJson<{ product: AdminProduct & Record<string, unknown> }>(
    `/api/v1/admin/products/${encodeURIComponent(productId)}`,
  );
}

export async function updateAdminProductStatus(
  productId: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
) {
  return requestJson<{ product: AdminProduct }>(
    `/api/v1/admin/products/${encodeURIComponent(productId)}/status`,
    { method: "PATCH", body: { status } },
  );
}

export async function fetchAdminOrders(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  return requestJson<{ items: AdminOrder[]; meta: AdminListMeta }>(
    `/api/v1/admin/orders?${search.toString()}`,
  );
}

export type AdminOrder = {
  id: string;
  customer: { id: string; name: string; email: string };
  itemCount: number;
  totalAmount: number;
  currency: "USD" | "INR";
  status: string;
  couponCode: string | null;
  paymentStatus: string | null;
  createdAt: string;
};

export async function fetchAdminOrder(orderId: string) {
  return requestJson<{ order: AdminOrder & Record<string, unknown> }>(
    `/api/v1/admin/orders/${encodeURIComponent(orderId)}`,
  );
}

export async function fetchAdminCoupons(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  return requestJson<{ items: unknown[]; meta: AdminListMeta }>(
    `/api/v1/admin/coupons?${search.toString()}`,
  );
}

export async function fetchAdminReports(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  return requestJson<{ items: AdminReport[]; meta: AdminListMeta }>(
    `/api/v1/admin/reports?${search.toString()}`,
  );
}

export type AdminReport = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string; email: string };
  target: Record<string, unknown>;
};

export async function fetchAdminReport(reportId: string) {
  return requestJson<{ report: AdminReport & Record<string, unknown> }>(
    `/api/v1/admin/reports/${encodeURIComponent(reportId)}`,
  );
}

export async function updateAdminReportStatus(
  reportId: string,
  status: "UNDER_REVIEW" | "RESOLVED" | "DISMISSED",
  resolutionNote?: string,
) {
  return requestJson<{ report: AdminReport }>(
    `/api/v1/admin/reports/${encodeURIComponent(reportId)}`,
    { method: "PATCH", body: { status, resolutionNote } },
  );
}

export async function fetchAdminAuditLogs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  return requestJson<{ items: unknown[]; meta: AdminListMeta }>(
    `/api/v1/admin/audit-logs?${search.toString()}`,
  );
}

export async function fetchAdminCategories() {
  return requestJson<{ items: AdminCategory[] }>(`/api/v1/admin/categories`);
}

export type AdminCategory = {
  id: string;
  label: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  productCount: number;
};

export async function createAdminCategory(body: Record<string, unknown>) {
  return requestJson<{ category: AdminCategory }>(`/api/v1/admin/categories`, {
    method: "POST",
    body,
  });
}

export async function updateAdminCategory(id: string, body: Record<string, unknown>) {
  return requestJson<{ category: AdminCategory }>(
    `/api/v1/admin/categories/${encodeURIComponent(id)}`,
    { method: "PATCH", body },
  );
}

export async function deleteAdminCategory(id: string) {
  return requestJson<{ ok: boolean }>(
    `/api/v1/admin/categories/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function createReport(body: {
  targetType: "PRODUCT" | "REVIEW" | "CREATOR";
  targetId: string;
  reason: string;
  description?: string;
}) {
  return requestJson<{ report: unknown }>(`/api/v1/reports`, {
    method: "POST",
    body,
  });
}
