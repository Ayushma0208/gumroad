import { ApiError } from "@/lib/api/client";
import type { AuthUser } from "@/types/auth";
import type { BecomeCreatorValues, LoginValues, SignupValues } from "@/lib/auth/schema";

/**
 * Auth API client.
 *
 * Default: same-origin `/auth/*` (Next.js mock that sets httpOnly cookies).
 * When Express is live, set NEXT_PUBLIC_USE_REMOTE_AUTH=true so requests
 * go to NEXT_PUBLIC_API_URL (POST /auth/login, GET /auth/me, …).
 */
function authBase() {
  if (process.env.NEXT_PUBLIC_USE_REMOTE_AUTH === "true") {
    return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  }
  return "";
}

async function authRequest<T>(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const response = await fetch(`${authBase()}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : response.statusText;
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

type UserResponse = { user: AuthUser };

export async function registerAccount(
  input: SignupValues,
): Promise<AuthUser> {
  const data = await authRequest<UserResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
  return data.user;
}

export async function loginAccount(input: LoginValues): Promise<AuthUser> {
  const data = await authRequest<UserResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
  return data.user;
}

export async function logoutAccount(): Promise<void> {
  await authRequest<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const data = await authRequest<UserResponse>("/auth/me", { method: "GET" });
    return data.user;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

export async function becomeCreatorAccount(
  input: BecomeCreatorValues,
): Promise<AuthUser> {
  const data = await authRequest<UserResponse>("/auth/become-creator", {
    method: "POST",
    body: input,
  });
  return data.user;
}

export async function checkStoreSlug(
  slug: string,
): Promise<{ slug: string; available: boolean }> {
  const params = new URLSearchParams({ slug });
  return authRequest(`/auth/store-slug?${params.toString()}`);
}
