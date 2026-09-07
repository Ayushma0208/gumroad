import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { createAvatar, createBanner } from "../media/media.controller";
import {
  listMine as listCreatorReviews,
} from "../reviews/review.controller";
import {
  creatorReviewsQuerySchema,
} from "../reviews/review.schema";
import {
  uploadAvatarMiddleware,
  uploadBannerMiddleware,
} from "../media/upload.middleware";
import { analyticsRouter } from "../analytics/analytics.routes";
import { earningsRouter, payoutsRouter } from "../payouts/payout.routes";
import {
  checkSlug,
  getBySlug,
  getMe,
  listCreators,
  listProducts,
  onboard,
  updateMe,
} from "./creator.controller";
import {
  creatorProductsQuerySchema,
  creatorSlugParamSchema,
  listCreatorsQuerySchema,
  onboardCreatorSchema,
  slugQuerySchema,
  updateCreatorProfileSchema,
} from "./creator.schema";

export const creatorRouter = Router();

/** Creator analytics — must be registered before `/:slug`. */
creatorRouter.use("/me/analytics", analyticsRouter);
creatorRouter.use("/me/earnings", earningsRouter);
creatorRouter.use("/me/payouts", payoutsRouter);

creatorRouter.get(
  "/",
  validateQuery(listCreatorsQuerySchema),
  asyncHandler(listCreators),
);
creatorRouter.get(
  "/store-slug",
  optionalAuth,
  validateQuery(slugQuerySchema),
  asyncHandler(checkSlug),
);
creatorRouter.get(
  "/slug/check",
  optionalAuth,
  validateQuery(slugQuerySchema),
  asyncHandler(checkSlug),
);
creatorRouter.get("/me", requireAuth, requireRole("CREATOR", "ADMIN"), asyncHandler(getMe));
creatorRouter.get(
  "/me/reviews",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  validateQuery(creatorReviewsQuerySchema),
  asyncHandler(listCreatorReviews),
);
creatorRouter.patch(
  "/me",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  validateBody(updateCreatorProfileSchema),
  asyncHandler(updateMe),
);
creatorRouter.post(
  "/onboard",
  requireAuth,
  validateBody(onboardCreatorSchema),
  asyncHandler(onboard),
);
creatorRouter.post(
  "/me/avatar",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  uploadAvatarMiddleware,
  asyncHandler(createAvatar),
);
creatorRouter.post(
  "/me/banner",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  uploadBannerMiddleware,
  asyncHandler(createBanner),
);
creatorRouter.get(
  "/:slug/products",
  validateParams(creatorSlugParamSchema),
  validateQuery(creatorProductsQuerySchema),
  asyncHandler(listProducts),
);
creatorRouter.get(
  "/:slug",
  validateParams(creatorSlugParamSchema),
  asyncHandler(getBySlug),
);
