import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { notFound } from "../../utils/app-error";
import {
  paginationMeta,
  parsePagination,
  skipTake,
} from "../../utils/pagination";
import { logEvent } from "../../utils/logger";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
  href?: string | null;
  eventKey?: string | null;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ?? undefined,
        href: input.href ?? null,
        eventKey: input.eventKey ?? null,
      },
    });
    return serializeNotification(notification);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      logEvent("notification_duplicate", {
        eventKey: input.eventKey ?? null,
        type: input.type,
      });
      return null;
    }
    logEvent("notification_create_failed", {
      type: input.type,
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

function serializeNotification(notification: {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Prisma.JsonValue;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    href: notification.href,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
    unread: notification.readAt == null,
  };
}

export async function listUserNotifications(
  userId: string,
  query: {
    page?: number;
    limit?: number;
    unread?: boolean;
    type?: NotificationType | "all";
  },
) {
  const pagination = parsePagination(query.page, query.limit ?? 20);
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(query.unread ? { readAt: null } : {}),
    ...(query.type && query.type !== "all" ? { type: query.type } : {}),
  };
  const [total, items] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...skipTake(pagination),
    }),
  ]);
  return {
    items: items.map(serializeNotification),
    meta: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markNotificationRead(userId: string, id: string) {
  const existing = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!existing) throw notFound("Notification not found.");
  if (existing.readAt) return serializeNotification(existing);
  const updated = await prisma.notification.update({
    where: { id: existing.id },
    data: { readAt: new Date() },
  });
  return serializeNotification(updated);
}

export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
}

export async function deleteNotification(userId: string, id: string) {
  const existing = await prisma.notification.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) throw notFound("Notification not found.");
  await prisma.notification.delete({ where: { id: existing.id } });
  return { ok: true };
}

export async function clearUserNotifications(userId: string) {
  const result = await prisma.notification.deleteMany({ where: { userId } });
  return { deleted: result.count };
}
