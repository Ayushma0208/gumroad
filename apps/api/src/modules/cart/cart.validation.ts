import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().trim().min(1, "Product is required."),
  quantity: z.number().int().min(1, "Quantity must be at least 1.").max(10).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1.").max(10),
});

export const cartItemParamsSchema = z.object({
  itemId: z.string().trim().min(1, "Item is required."),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
