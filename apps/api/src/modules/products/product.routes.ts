import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  validateBody,
  validateParams,
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
  create as createReview,
  eligibility as reviewEligibility,
  listForProduct as listProductReviews,
  summary as reviewSummary,
} from "../reviews/review.controller";
import {
  createReviewSchema,
  listReviewsQuerySchema,
  productIdParamSchema,
} from "../reviews/review.schema";
import {
  createFile,
  createImage,
  listFiles,
  listImages,
  removeFile,
  removeImage,
  reorderImages,
} from "../media/media.controller";
import {
  uploadProductFileMiddleware,
  uploadProductImageMiddleware,
} from "../media/upload.middleware";
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
productRouter.get(
  "/:productId/reviews/summary",
  validateParams(productIdParamSchema),
  asyncHandler(reviewSummary),
);
productRouter.get(
  "/:productId/reviews/eligibility",
  optionalAuth,
  validateParams(productIdParamSchema),
  asyncHandler(reviewEligibility),
);
productRouter.get(
  "/:productId/reviews",
  validateParams(productIdParamSchema),
  validateQuery(listReviewsQuerySchema),
  asyncHandler(listProductReviews),
);
productRouter.post(
  "/:productId/reviews",
  requireAuth,
  validateParams(productIdParamSchema),
  validateBody(createReviewSchema),
  asyncHandler(createReview),
);
productRouter.get("/:id/related", asyncHandler(related));
productRouter.get(
  "/:productId/files",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  asyncHandler(listFiles),
);
productRouter.post(
  "/:productId/files",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  uploadProductFileMiddleware,
  asyncHandler(createFile),
);
productRouter.delete(
  "/:productId/files/:fileId",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  asyncHandler(removeFile),
);
productRouter.get(
  "/:productId/images",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  asyncHandler(listImages),
);
productRouter.post(
  "/:productId/images",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  uploadProductImageMiddleware,
  asyncHandler(createImage),
);
productRouter.patch(
  "/:productId/images/reorder",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  asyncHandler(reorderImages),
);
productRouter.delete(
  "/:productId/images/:imageId",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  asyncHandler(removeImage),
);
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
