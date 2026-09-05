import type { Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { forbidden, notFound } from "../../utils/app-error";

export async function assertProductOwnership(
  userId: string,
  role: Role,
  product: { creatorId: string },
) {
  if (role === "ADMIN") return;
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile || profile.id !== product.creatorId) {
    throw forbidden("You cannot change another creator’s product.");
  }
}

export async function getCustomerProductAccess(userId: string, productId: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { userId_productId: { userId, productId } },
    include: {
      order: { select: { id: true, status: true } },
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          productType: true,
          status: true,
          creator: { select: { storeName: true, slug: true } },
        },
      },
    },
  });
  if (!purchase || purchase.order.status !== "PAID") return null;
  return purchase;
}

export async function assertPurchasedProduct(userId: string, productId: string) {
  const access = await getCustomerProductAccess(userId, productId);
  if (!access) {
    throw forbidden("You do not own this product.");
  }
  return access;
}
