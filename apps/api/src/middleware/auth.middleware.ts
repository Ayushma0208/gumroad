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
  sv?: number;
};

const JWT_VERIFY_OPTS: jwt.VerifyOptions = {
  algorithms: ["HS256"],
};

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.[cookieName()];
    if (!token || typeof token !== "string") {
      throw unauthorized();
    }

    let payload: AccessToken;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, JWT_VERIFY_OPTS) as AccessToken;
    } catch {
      throw unauthorized("Session expired. Sign in again.");
    }

    if (!payload.sub || typeof payload.sub !== "string") {
      throw unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        sessionVersion: true,
      },
    });

    if (!user) {
      throw unauthorized();
    }

    if (user.status === "SUSPENDED") {
      throw unauthorized("This account has been suspended.");
    }

    const tokenVersion = typeof payload.sv === "number" ? payload.sv : 0;
    const dbVersion =
      typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
    if (tokenVersion !== dbVersion) {
      throw unauthorized("Session expired. Sign in again.");
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
      const payload = jwt.verify(
        token,
        env.JWT_SECRET,
        JWT_VERIFY_OPTS,
      ) as AccessToken;
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          sessionVersion: true,
        },
      });
      if (!user || user.status === "SUSPENDED") {
        next();
        return;
      }
      const tokenVersion = typeof payload.sv === "number" ? payload.sv : 0;
      const dbVersion =
        typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
      if (tokenVersion === dbVersion) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    } catch {
      /* ignore invalid optional session */
    }
    next();
  } catch (error) {
    next(error);
  }
};
