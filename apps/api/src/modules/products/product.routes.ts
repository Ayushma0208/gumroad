import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { create, getBySlug, list, update } from "./product.controller";
import { createProductSchema, updateProductSchema } from "./product.schema";

export const productRouter = Router();

productRouter.get("/", asyncHandler(list));
productRouter.get("/:slug", asyncHandler(getBySlug));
productRouter.post(
  "/",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  validateBody(createProductSchema),
  asyncHandler(create),
);
productRouter.patch(
  "/:id",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  validateBody(updateProductSchema),
  asyncHandler(update),
);
