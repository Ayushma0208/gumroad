import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import {
  conflict,
  forbidden,
  unauthorized,
} from "../../utils/app-error";
import { logEvent } from "../../utils/logger";
import { toPublicUser, type PublicUser } from "./auth.types";
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from "./auth.schema";

const userInclude = { creatorProfile: true } as const;

/** Constant-time login: always run bcrypt even when the user is missing. */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "__lumen_timing_dummy_password__",
  12,
);

export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Keep conflict for UX compatibility; rate-limited. Prefer generic copy.
    throw conflict("Unable to create an account with that email.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      role: "CUSTOMER",
      sessionVersion: 0,
    },
    include: userInclude,
  });

  return toPublicUser(user);
}

export async function loginUser(input: LoginInput): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    include: userInclude,
  });

  const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const matches = await bcrypt.compare(input.password, hash);
  if (!user || !matches) {
    throw unauthorized("Email or password is incorrect.");
  }

  if (user.status === "SUSPENDED") {
    throw forbidden("This account has been suspended.");
  }

  return toPublicUser(user);
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: userInclude,
  });
  return user ? toPublicUser(user) : null;
}

export async function getSessionSigningUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, sessionVersion: true, status: true },
  });
}

export async function bumpSessionVersion(userId: string) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
    select: { id: true, role: true, sessionVersion: true },
  });
  return updated;
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized();

  const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!matches) {
    throw unauthorized("Current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 },
    },
  });
  logEvent("password_changed", { userId });
  return { ok: true as const };
}

/**
 * Soft-close: anonymize PII and suspend. Financial records are retained.
 * Creators and admins cannot self-close (product/payout retention).
 */
export async function closeAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { creatorProfile: true },
  });
  if (!user) throw unauthorized();

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw unauthorized("Password is incorrect.");
  }

  if (user.role === "ADMIN") {
    throw forbidden("Admin accounts cannot be closed this way.");
  }
  if (user.creatorProfile) {
    throw forbidden(
      "Creator accounts cannot be closed from Account. Contact support so products and sales records stay intact.",
    );
  }

  const closedEmail = `closed+${user.id}@lumen.invalid`;
  const passwordHash = await bcrypt.hash(`closed-${user.id}-${Date.now()}`, 12);
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: "Closed account",
      email: closedEmail,
      passwordHash,
      avatarUrl: null,
      avatarPublicId: null,
      status: "SUSPENDED",
      sessionVersion: { increment: 1 },
    },
  });
  logEvent("account_closed", { userId });
  return { ok: true as const };
}

export function signAccessToken(user: {
  id: string;
  role: Role;
  sessionVersion: number;
}): string {
  return jwt.sign(
    { sub: user.id, role: user.role, sv: user.sessionVersion },
    env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    },
  );
}

export async function signAccessTokenForUserId(userId: string): Promise<string> {
  const user = await getSessionSigningUser(userId);
  if (!user || user.status === "SUSPENDED") {
    throw unauthorized();
  }
  return signAccessToken(user);
}
