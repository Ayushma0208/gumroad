import type { Request, Response } from "express";
import { cookieName, sessionCookieOptions } from "../../config/cookies";
import { unauthorized } from "../../utils/app-error";
import { success } from "../../utils/response";
import {
  changePassword,
  getUserById,
  loginUser,
  registerUser,
  signAccessTokenForUserId,
} from "./auth.service";
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from "./auth.schema";

function setSession(res: Response, token: string) {
  res.cookie(cookieName(), token, sessionCookieOptions());
}

export async function register(req: Request, res: Response) {
  const user = await registerUser(req.body as RegisterInput);
  setSession(res, await signAccessTokenForUserId(user.id));
  res.status(201).json(success({ user }));
}

export async function login(req: Request, res: Response) {
  const user = await loginUser(req.body as LoginInput);
  setSession(res, await signAccessTokenForUserId(user.id));
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

export async function changePasswordHandler(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  await changePassword(req.user.id, req.body as ChangePasswordInput);
  // Re-issue cookie with bumped sessionVersion; other devices invalidated.
  setSession(res, await signAccessTokenForUserId(req.user.id));
  res.json(success({ ok: true }));
}
