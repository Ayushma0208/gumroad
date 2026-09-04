import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { create, list } from "./category.controller";
import { createCategorySchema } from "./category.schema";

export const categoryRouter = Router();

categoryRouter.get("/", asyncHandler(list));
categoryRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(createCategorySchema),
  asyncHandler(create),
);
