import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import {
  add,
  check,
  clear,
  ids,
  list,
  remove,
  status,
} from "./wishlist.controller";
import {
  addWishlistItemSchema,
  listWishlistQuerySchema,
  wishlistProductParamSchema,
  wishlistStatusQuerySchema,
} from "./wishlist.schema";

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);

wishlistRouter.get("/", validateQuery(listWishlistQuerySchema), asyncHandler(list));
wishlistRouter.get("/ids", asyncHandler(ids));
wishlistRouter.get(
  "/status",
  validateQuery(wishlistStatusQuerySchema),
  asyncHandler(status),
);
wishlistRouter.get(
  "/check/:productId",
  validateParams(wishlistProductParamSchema),
  asyncHandler(check),
);
wishlistRouter.post(
  "/items",
  validateBody(addWishlistItemSchema),
  asyncHandler(add),
);
wishlistRouter.delete(
  "/items/:productId",
  validateParams(wishlistProductParamSchema),
  asyncHandler(remove),
);
wishlistRouter.delete("/", asyncHandler(clear));
