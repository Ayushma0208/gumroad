import type { Role } from "@prisma/client";
import type { RequestHandler } from "express";
import { forbidden, unauthorized } from "../utils/app-error";

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(forbidden());
      return;
    }
    next();
  };
}
