import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  validateBody,
  validateParams,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import {
  addItem,
  emptyCart,
  getCart,
  removeItem,
  updateItem,
} from "./cart.controller";
import {
  addCartItemSchema,
  cartItemParamsSchema,
  updateCartItemSchema,
} from "./cart.validation";

export const cartRouter = Router();
const buyer = [requireAuth, requireRole("CUSTOMER", "CREATOR")] as const;

cartRouter.get("/", ...buyer, asyncHandler(getCart));
cartRouter.post(
  "/items",
  ...buyer,
  validateBody(addCartItemSchema),
  asyncHandler(addItem),
);
cartRouter.patch(
  "/items/:itemId",
  ...buyer,
  validateParams(cartItemParamsSchema),
  validateBody(updateCartItemSchema),
  asyncHandler(updateItem),
);
cartRouter.delete(
  "/items/:itemId",
  ...buyer,
  validateParams(cartItemParamsSchema),
  asyncHandler(removeItem),
);
cartRouter.delete("/", ...buyer, asyncHandler(emptyCart));
