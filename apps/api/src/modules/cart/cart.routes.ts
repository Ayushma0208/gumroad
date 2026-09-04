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
const customer = [requireAuth, requireRole("CUSTOMER")] as const;

cartRouter.get("/", ...customer, asyncHandler(getCart));
cartRouter.post(
  "/items",
  ...customer,
  validateBody(addCartItemSchema),
  asyncHandler(addItem),
);
cartRouter.patch(
  "/items/:itemId",
  ...customer,
  validateParams(cartItemParamsSchema),
  validateBody(updateCartItemSchema),
  asyncHandler(updateItem),
);
cartRouter.delete(
  "/items/:itemId",
  ...customer,
  validateParams(cartItemParamsSchema),
  asyncHandler(removeItem),
);
cartRouter.delete("/", ...customer, asyncHandler(emptyCart));
