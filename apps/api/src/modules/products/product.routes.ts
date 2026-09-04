import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  validateBody,
  validateQuery,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import {
  archive,
  create,
  featured,
  getById,
  getBySlug,
  list,
  mine,
  publish,
  related,
  remove,
  trending,
  update,
} from "./product.controller";
import {
  createProductSchema,
  listProductsQuerySchema,
  myProductsQuerySchema,
  paginationQuerySchema,
  updateProductSchema,
} from "./product.validation";

export const productRouter = Router();

productRouter.get("/", validateQuery(listProductsQuerySchema), asyncHandler(list));
productRouter.get("/featured", validateQuery(paginationQuerySchema), asyncHandler(featured));
productRouter.get("/trending", validateQuery(paginationQuerySchema), asyncHandler(trending));
productRouter.get(
  "/my",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  validateQuery(myProductsQuerySchema),
  asyncHandler(mine),
);
productRouter.get("/slug/:slug", asyncHandler(getBySlug));
productRouter.get("/:id/related", asyncHandler(related));
productRouter.get("/:id", optionalAuth, asyncHandler(getById));

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
productRouter.delete(
  "/:id",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  asyncHandler(remove),
);
productRouter.post(
  "/:id/publish",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  asyncHandler(publish),
);
productRouter.post(
  "/:id/archive",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  asyncHandler(archive),
);
