import type { Request, Response } from "express";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import type {
  ListNotificationsQuery,
  UpdatePreferencesInput,
} from "./notification.schema";
import {
  clearUserNotifications,
  deleteNotification,
  getUnreadNotificationCount,
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notification.service";
import {
  getOrCreateNotificationPreferences,
  updateNotificationPreferences,
} from "./preference.service";
import { getEmailJobHealth, processPendingEmails } from "../email/email.service";

function actor(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

export async function list(req: Request, res: Response) {
  const user = actor(req);
  const data = await listUserNotifications(
    user.id,
    req.query as unknown as ListNotificationsQuery,
  );
  res.json(success(data));
}

export async function unreadCount(req: Request, res: Response) {
  const user = actor(req);
  const count = await getUnreadNotificationCount(user.id);
  res.json(success({ count }));
}

export async function markRead(req: Request, res: Response) {
  const user = actor(req);
  const notification = await markNotificationRead(
    user.id,
    String(req.params.notificationId),
  );
  res.json(success({ notification }));
}

export async function markAllRead(req: Request, res: Response) {
  const user = actor(req);
  const data = await markAllNotificationsRead(user.id);
  res.json(success(data));
}

export async function remove(req: Request, res: Response) {
  const user = actor(req);
  await deleteNotification(user.id, String(req.params.notificationId));
  res.json(success({ ok: true }));
}

export async function clearAll(req: Request, res: Response) {
  const user = actor(req);
  const data = await clearUserNotifications(user.id);
  res.json(success(data));
}

export async function getPreferences(req: Request, res: Response) {
  const user = actor(req);
  const preferences = await getOrCreateNotificationPreferences(user.id);
  res.json(success({ preferences }));
}

export async function patchPreferences(req: Request, res: Response) {
  const user = actor(req);
  const preferences = await updateNotificationPreferences(
    user.id,
    req.body as UpdatePreferencesInput,
  );
  res.json(success({ preferences }));
}

export async function emailHealth(_req: Request, res: Response) {
  const data = await getEmailJobHealth();
  res.json(success(data));
}

export async function processEmails(_req: Request, res: Response) {
  const processed = await processPendingEmails(25);
  res.json(success({ processed: processed.filter(Boolean).length }));
}
