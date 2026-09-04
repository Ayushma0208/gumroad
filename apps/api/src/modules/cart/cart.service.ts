import { prisma } from "../../config/database";

export async function getOrCreateCart(userId: string) {
  const cart = await prisma.cart.upsert({
    where: { customerId: userId },
    create: { customerId: userId },
    update: {},
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              title: true,
              price: true,
              currency: true,
              coverImage: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return {
    id: cart.id,
    items: cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        slug: item.product.slug,
        title: item.product.title,
        priceCents: item.product.price,
        currency: item.product.currency,
        coverImage: item.product.coverImage,
        status: item.product.status,
      },
    })),
  };
}
