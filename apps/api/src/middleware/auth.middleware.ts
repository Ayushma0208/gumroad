import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { cookieName } from "../config/cookies";
import { env } from "../config/env";
import { prisma } from "../config/database";
import { unauthorized } from "../utils/app-error";
import type { AuthContext } from "../types/auth-context";
import type { Role } from "@prisma/client";

type AccessToken = {
  sub: string;
  role: Role;
};

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.[cookieName()];
    if (!token || typeof token !== "string") {
      throw unauthorized();
    }

    let payload: AccessToken;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as AccessToken;
    } catch {
      throw unauthorized("Session expired. Sign in again.");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw unauthorized();
    }

    const context: AuthContext = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    req.user = context;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.[cookieName()];
    if (!token || typeof token !== "string") {
      next();
      return;
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AccessToken;
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      });
      if (user) {
        req.user = user;
      }
    } catch {
      /* ignore invalid optional session */
    }
    next();
  } catch (error) {
    next(error);
  }
};
