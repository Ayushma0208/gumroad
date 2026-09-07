import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  validateBody,
} from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import { closeAccount } from "../auth/auth.service";
import {
  createUserAvatar,
  removeUserAvatar,
} from "../media/media.controller";
import { uploadAvatarMiddleware } from "../media/upload.middleware";
import { listMyReviews } from "../reviews/review.service";
import {
  closeAccountSchema,
  updateProfileSchema,
  type CloseAccountInput,
  type UpdateProfileInput,
} from "./user.schema";
import {
  requireCurrentUser,
  updateCurrentUserProfile,
} from "./user.service";
import { cookieName, sessionCookieOptions } from "../../config/cookies";

export const userRouter = Router();

userRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    const user = await requireCurrentUser(req.user.id);
    res.json(success({ user }));
  }),
);

userRouter.patch(
  "/me",
  requireAuth,
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    const user = await updateCurrentUserProfile(
      req.user.id,
      req.body as UpdateProfileInput,
    );
    res.json(success({ user }));
  }),
);

userRouter.post(
  "/me/avatar",
  requireAuth,
  uploadAvatarMiddleware,
  asyncHandler(createUserAvatar),
);

userRouter.delete(
  "/me/avatar",
  requireAuth,
  asyncHandler(removeUserAvatar),
);

userRouter.get(
  "/me/reviews",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const data = await listMyReviews(req.user.id, { page, limit });
    res.json(success(data));
  }),
);

userRouter.delete(
  "/me",
  requireAuth,
  validateBody(closeAccountSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    const body = req.body as CloseAccountInput;
    await closeAccount(req.user.id, body.password);
    res.clearCookie(cookieName(), { ...sessionCookieOptions(), maxAge: 0 });
    res.json(success({ ok: true }));
  }),
);

userRouter.get(
  "/creator-only",
  requireAuth,
  requireRole("CREATOR", "ADMIN"),
  (_req, res) => {
    res.json(success({ ok: true }));
  },
);
