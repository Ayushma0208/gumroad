import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { create, getBySlug, list, remove, update } from "./category.controller";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./category.validation";

export const categoryRouter = Router();

categoryRouter.get("/", asyncHandler(list));
categoryRouter.get("/:slug", asyncHandler(getBySlug));
categoryRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(createCategorySchema),
  asyncHandler(create),
);
categoryRouter.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(updateCategorySchema),
  asyncHandler(update),
);
categoryRouter.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(remove),
);
