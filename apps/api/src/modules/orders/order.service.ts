import { prisma } from "../../config/database";

export async function listOrdersForUser(userId: string) {
  const orders = await prisma.order.findMany({
    where: { customerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { select: { id: true, title: true, slug: true, coverImage: true } },
        },
      },
      payment: {
        select: { id: true, status: true, provider: true, amount: true, currency: true },
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    totalAmount: order.totalAmount,
    currency: order.currency,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      creatorId: item.creatorId,
      price: item.price,
      quantity: item.quantity,
      product: item.product,
    })),
    payment: order.payment,
  }));
}
