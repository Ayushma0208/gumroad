import { requestJson } from "@/lib/api/http";

export type NotificationType =
  | "PURCHASE_SUCCESS"
  | "CREATOR_SALE"
  | "REVIEW_RECEIVED"
  | "PRODUCT_APPROVED"
  | "PRODUCT_UNPUBLISHED"
  | "PRODUCT_ARCHIVED"
  | "ACCOUNT_UPDATE";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: unknown;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  unread: boolean;
};

export type NotificationPreferences = {
  marketingEmailEnabled: boolean;
  purchaseEmails: boolean;
  creatorSaleEmails: boolean;
  reviewEmails: boolean;
  productModerationEmails: boolean;
  securityEmails: boolean;
  updatedAt: string;
};

export async function fetchNotifications(params: {
  page?: number;
  limit?: number;
  unread?: boolean;
  type?: NotificationType | "all";
}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.unread) search.set("unread", "true");
  if (params.type && params.type !== "all") search.set("type", params.type);
  return requestJson<{
    items: AppNotification[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>(`/api/v1/notifications?${search.toString()}`);
}

export async function fetchUnreadNotificationCount() {
  return requestJson<{ count: number }>("/api/v1/notifications/unread-count");
}

export async function markNotificationRead(id: string) {
  return requestJson<{ notification: AppNotification }>(
    `/api/v1/notifications/${encodeURIComponent(id)}/read`,
    { method: "PATCH" },
  );
}

export async function markAllNotificationsRead() {
  return requestJson<{ updated: number }>("/api/v1/notifications/read-all", {
    method: "POST",
  });
}

export async function deleteNotification(id: string) {
  return requestJson<{ ok: boolean }>(
    `/api/v1/notifications/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function fetchNotificationPreferences() {
  return requestJson<{ preferences: NotificationPreferences }>(
    "/api/v1/notification-preferences",
  );
}

export async function updateNotificationPreferences(
  body: Partial<
    Omit<NotificationPreferences, "securityEmails" | "updatedAt">
  >,
) {
  return requestJson<{ preferences: NotificationPreferences }>(
    "/api/v1/notification-preferences",
    { method: "PATCH", body },
  );
}
