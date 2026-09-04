import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../utils/app-error";
import { isDigitalProduct, serializeCart, type CartDto } from "./cart.types";
import type { AddCartItemInput, UpdateCartItemInput } from "./cart.validation";

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          price: true,
          currency: true,
          productType: true,
          status: true,
          creator: { select: { storeName: true, slug: true, userId: true } },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

async function loadCart(customerId: string) {
  return prisma.cart.upsert({
    where: { customerId },
    create: { customerId },
    update: {},
    include: cartInclude,
  });
}

export async function getCartForCustomer(customerId: string): Promise<CartDto> {
  const cart = await loadCart(customerId);
  return serializeCart(cart);
}

async function assertNotOwned(customerId: string, productId: string) {
  const owned = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { customerId, status: "PAID" },
    },
    select: { id: true },
  });
  if (owned) {
    throw conflict("You already own this product.");
  }
}

export async function addCartItem(
  customerId: string,
  input: AddCartItemInput,
): Promise<CartDto> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    include: { creator: { select: { userId: true } } },
  });
  if (!product) throw notFound("Product not found");
  if (product.status !== "PUBLISHED") {
    throw badRequest("This product is no longer available.");
  }
  if (product.creator.userId === customerId) {
    throw forbidden("You cannot add your own product to the bag.");
  }
  await assertNotOwned(customerId, product.id);

  const digital = isDigitalProduct(product.productType);
  if (digital && input.quantity !== 1) {
    throw badRequest("Digital products are added once.");
  }

  await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({
      where: { customerId },
      create: { customerId },
      update: {},
    });

    const existing = await tx.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: cart.id, productId: product.id },
      },
    });

    if (existing) {
      if (digital) return;
      const nextQuantity = Math.min(existing.quantity + input.quantity, 10);
      await tx.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQuantity },
      });
      return;
    }

    try {
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: digital ? 1 : input.quantity,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return;
      }
      throw error;
    }
  });

  return getCartForCustomer(customerId);
}

export async function updateCartItem(
  customerId: string,
  itemId: string,
  input: UpdateCartItemInput,
): Promise<CartDto> {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: { select: { customerId: true } },
      product: { select: { productType: true } },
    },
  });
  if (!item || item.cart.customerId !== customerId) {
    throw notFound("Cart item not found");
  }

  if (isDigitalProduct(item.product.productType)) {
    if (input.quantity !== 1) {
      throw badRequest("Digital products stay at a quantity of 1.");
    }
    return getCartForCustomer(customerId);
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity: input.quantity },
  });
  return getCartForCustomer(customerId);
}

export async function removeCartItem(
  customerId: string,
  itemId: string,
): Promise<CartDto> {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: { select: { customerId: true } } },
  });
  if (!item || item.cart.customerId !== customerId) {
    throw notFound("Cart item not found");
  }
  await prisma.cartItem.delete({ where: { id: item.id } });
  return getCartForCustomer(customerId);
}

export async function clearCart(customerId: string): Promise<CartDto> {
  const cart = await prisma.cart.findUnique({ where: { customerId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  return getCartForCustomer(customerId);
}
