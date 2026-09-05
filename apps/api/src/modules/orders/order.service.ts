import { prisma } from "../../config/database";
import { forbidden, notFound } from "../../utils/app-error";
import { orderDetailInclude } from "../payments/payment.service";
import { serializeOrder } from "../payments/payment.types";

export async function listOrdersForUser(
  userId: string,
  role: "CUSTOMER" | "CREATOR" | "ADMIN",
) {
  const orders = await prisma.order.findMany({
    where: role === "ADMIN" ? {} : { customerId: userId },
    orderBy: { createdAt: "desc" },
    include: orderDetailInclude,
  });
  return orders.map(serializeOrder);
}

export async function getOrderForViewer(
  orderId: string,
  viewer: { id: string; role: "CUSTOMER" | "CREATOR" | "ADMIN" },
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderDetailInclude,
  });
  if (!order) throw notFound("Order not found");
  if (viewer.role !== "ADMIN" && order.customerId !== viewer.id) {
    throw forbidden("You cannot view this order.");
  }
  return serializeOrder(order);
}

export async function listPurchasesForUser(userId: string) {
  const purchases = await prisma.purchase.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          productType: true,
          creator: { select: { storeName: true, slug: true } },
        },
      },
      order: { select: { id: true, createdAt: true } },
    },
  });
  return purchases.map((purchase) => ({
    id: purchase.id,
    productId: purchase.productId,
    orderId: purchase.orderId,
    createdAt: purchase.createdAt.toISOString(),
    product: purchase.product,
  }));
}
