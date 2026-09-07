import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import {
  clearAll,
  emailHealth,
  getPreferences,
  list,
  markAllRead,
  markRead,
  patchPreferences,
  processEmails,
  remove,
  unreadCount,
} from "./notification.controller";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  updatePreferencesSchema,
} from "./notification.schema";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get(
  "/",
  validateQuery(listNotificationsQuerySchema),
  asyncHandler(list),
);
notificationRouter.get("/unread-count", asyncHandler(unreadCount));
notificationRouter.post("/read-all", asyncHandler(markAllRead));
notificationRouter.delete("/", asyncHandler(clearAll));
notificationRouter.patch(
  "/:notificationId/read",
  validateParams(notificationIdParamSchema),
  asyncHandler(markRead),
);
notificationRouter.delete(
  "/:notificationId",
  validateParams(notificationIdParamSchema),
  asyncHandler(remove),
);

export const notificationPreferenceRouter = Router();

notificationPreferenceRouter.use(requireAuth);
notificationPreferenceRouter.get("/", asyncHandler(getPreferences));
notificationPreferenceRouter.patch(
  "/",
  validateBody(updatePreferencesSchema),
  asyncHandler(patchPreferences),
);

/** Admin email ops — registered under /admin in admin.routes or here via separate mount */
export const emailOpsHandlers = {
  health: asyncHandler(emailHealth),
  process: asyncHandler(processEmails),
  requireAdmin: [requireAuth, requireRole("ADMIN")] as const,
};
