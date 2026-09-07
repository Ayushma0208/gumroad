import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { prisma } from "../../config/database";
import { success } from "../../utils/response";
import {
  listAdmin,
  moderate,
  removeAdmin,
} from "../reviews/review.controller";
import {
  adminReviewsQuerySchema,
  moderateReviewSchema,
  reviewIdParamSchema,
} from "../reviews/review.schema";

export const adminRouter = Router();

adminRouter.get(
  "/overview",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const [users, products, orders] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
    ]);
    res.json(success({ users, products, orders }));
  }),
);

adminRouter.get(
  "/reviews",
  requireAuth,
  requireRole("ADMIN"),
  validateQuery(adminReviewsQuerySchema),
  asyncHandler(listAdmin),
);
adminRouter.patch(
  "/reviews/:reviewId",
  requireAuth,
  requireRole("ADMIN"),
  validateParams(reviewIdParamSchema),
  validateBody(moderateReviewSchema),
  asyncHandler(moderate),
);
adminRouter.delete(
  "/reviews/:reviewId",
  requireAuth,
  requireRole("ADMIN"),
  validateParams(reviewIdParamSchema),
  asyncHandler(removeAdmin),
);
