import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { createRateLimiter } from "../../middleware/rate-limit.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { login, logout, me, register, changePasswordHandler } from "./auth.controller";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from "./auth.schema";

export const authRouter = Router();

const authBurst = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: "auth",
});

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "auth-login",
  keyFromRequest: (req) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : undefined;
    return email;
  },
});

authRouter.post(
  "/register",
  authBurst,
  validateBody(registerSchema),
  asyncHandler(register),
);
authRouter.post(
  "/login",
  loginLimiter,
  validateBody(loginSchema),
  asyncHandler(login),
);
authRouter.post("/logout", asyncHandler(logout));
authRouter.get("/me", requireAuth, asyncHandler(me));
authRouter.post(
  "/change-password",
  requireAuth,
  authBurst,
  validateBody(changePasswordSchema),
  asyncHandler(changePasswordHandler),
);
