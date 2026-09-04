import type { Request, Response } from "express";
import { cookieName, sessionCookieOptions } from "../../config/cookies";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import {
  getUserById,
  loginUser,
  registerUser,
  signAccessToken,
} from "./auth.service";
import type { LoginInput, RegisterInput } from "./auth.schema";

function setSession(res: Response, userIdToken: string) {
  res.cookie(cookieName(), userIdToken, sessionCookieOptions());
}

export async function register(req: Request, res: Response) {
  const user = await registerUser(req.body as RegisterInput);
  setSession(res, signAccessToken(user));
  res.status(201).json(success({ user }));
}

export async function login(req: Request, res: Response) {
  const user = await loginUser(req.body as LoginInput);
  setSession(res, signAccessToken(user));
  res.json(success({ user }));
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(cookieName(), { ...sessionCookieOptions(), maxAge: 0 });
  res.json(success({ ok: true }));
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const user = await getUserById(req.user.id);
  if (!user) {
    throw unauthorized();
  }
  res.json(success({ user }));
}
