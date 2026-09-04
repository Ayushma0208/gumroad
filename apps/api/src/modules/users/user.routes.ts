import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { getUserById } from "../auth/auth.service";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";

export const userRouter = Router();

userRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    const user = await getUserById(req.user.id);
    if (!user) throw unauthorized();
    res.json(success({ user }));
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
