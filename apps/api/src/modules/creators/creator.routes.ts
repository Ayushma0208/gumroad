import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { checkSlug, onboard } from "./creator.controller";
import { onboardCreatorSchema, slugQuerySchema } from "./creator.schema";
import { createAvatar } from "../media/media.controller";
import { uploadAvatarMiddleware } from "../media/upload.middleware";
import { requireRole } from "../../middleware/role.middleware";

export const creatorRouter = Router();

creatorRouter.get(
  "/store-slug",
  optionalAuth,
  validateQuery(slugQuerySchema),
  asyncHandler(checkSlug),
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
