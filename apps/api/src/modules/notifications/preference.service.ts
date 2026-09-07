import { prisma } from "../../config/database";

const defaults = {
  marketingEmailEnabled: false,
  purchaseEmails: true,
  creatorSaleEmails: true,
  reviewEmails: true,
  productModerationEmails: true,
  securityEmails: true,
} as const;

export async function getOrCreateNotificationPreferences(userId: string) {
  const existing = await prisma.notificationPreference.findUnique({
    where: { userId },
  });
  if (existing) return serializePreferences(existing);
  const created = await prisma.notificationPreference.create({
    data: { userId, ...defaults },
  });
  return serializePreferences(created);
}

export async function updateNotificationPreferences(
  userId: string,
  input: {
    marketingEmailEnabled?: boolean;
    purchaseEmails?: boolean;
    creatorSaleEmails?: boolean;
    reviewEmails?: boolean;
    productModerationEmails?: boolean;
  },
) {
  await getOrCreateNotificationPreferences(userId);
  const updated = await prisma.notificationPreference.update({
    where: { userId },
    data: {
      ...(input.marketingEmailEnabled !== undefined
        ? { marketingEmailEnabled: input.marketingEmailEnabled }
        : {}),
      ...(input.purchaseEmails !== undefined
        ? { purchaseEmails: input.purchaseEmails }
        : {}),
      ...(input.creatorSaleEmails !== undefined
        ? { creatorSaleEmails: input.creatorSaleEmails }
        : {}),
      ...(input.reviewEmails !== undefined
        ? { reviewEmails: input.reviewEmails }
        : {}),
      ...(input.productModerationEmails !== undefined
        ? { productModerationEmails: input.productModerationEmails }
        : {}),
      // securityEmails is always required — ignore client attempts to disable.
      securityEmails: true,
    },
  });
  return serializePreferences(updated);
}

function serializePreferences(prefs: {
  marketingEmailEnabled: boolean;
  purchaseEmails: boolean;
  creatorSaleEmails: boolean;
  reviewEmails: boolean;
  productModerationEmails: boolean;
  securityEmails: boolean;
  updatedAt: Date;
}) {
  return {
    marketingEmailEnabled: prefs.marketingEmailEnabled,
    purchaseEmails: prefs.purchaseEmails,
    creatorSaleEmails: prefs.creatorSaleEmails,
    reviewEmails: prefs.reviewEmails,
    productModerationEmails: prefs.productModerationEmails,
    securityEmails: true,
    updatedAt: prefs.updatedAt.toISOString(),
  };
}

export type PreferenceFlags = Awaited<
  ReturnType<typeof getOrCreateNotificationPreferences>
>;

export async function shouldSendEmail(
  userId: string,
  category:
    | "purchase"
    | "creatorSale"
    | "review"
    | "productModeration"
    | "security",
) {
  if (category === "security") return true;
  const prefs = await getOrCreateNotificationPreferences(userId);
  if (category === "purchase") return prefs.purchaseEmails;
  if (category === "creatorSale") return prefs.creatorSaleEmails;
  if (category === "review") return prefs.reviewEmails;
  return prefs.productModerationEmails;
}
