import { NotificationType } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(48).optional(),
  unread: z
    .preprocess((value) => {
      if (value === "true" || value === true) return true;
      if (value === "false" || value === false) return false;
      return undefined;
    }, z.boolean().optional()),
  type: z.preprocess(
    emptyToUndefined,
    z.union([z.nativeEnum(NotificationType), z.literal("all")]).optional(),
  ),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export const notificationIdParamSchema = z.object({
  notificationId: z.string().min(1),
});

export const updatePreferencesSchema = z
  .object({
    marketingEmailEnabled: z.boolean().optional(),
    purchaseEmails: z.boolean().optional(),
    creatorSaleEmails: z.boolean().optional(),
    reviewEmails: z.boolean().optional(),
    productModerationEmails: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one preference to update.",
  });

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
