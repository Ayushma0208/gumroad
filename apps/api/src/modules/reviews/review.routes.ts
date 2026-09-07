import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  validateBody,
  validateParams,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { remove, reply, update } from "./review.controller";
import {
  reviewIdParamSchema,
  reviewReplySchema,
  updateReviewSchema,
} from "./review.schema";

export const reviewRouter = Router();

reviewRouter.patch(
  "/:reviewId",
  requireAuth,
  validateParams(reviewIdParamSchema),
  validateBody(updateReviewSchema),
  asyncHandler(update),
);
reviewRouter.delete(
  "/:reviewId",
  requireAuth,
  validateParams(reviewIdParamSchema),
  asyncHandler(remove),
);
reviewRouter.post(
  "/:reviewId/reply",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  validateParams(reviewIdParamSchema),
  validateBody(reviewReplySchema),
  asyncHandler(reply),
);
