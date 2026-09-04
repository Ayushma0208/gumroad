import { ApiError } from "@/lib/api/client";
import { remoteApiEnabled, requestJson } from "@/lib/api/http";
import type { AuthUser } from "@/types/auth";
import type { BecomeCreatorValues, LoginValues, SignupValues } from "@/lib/auth/schema";

type UserPayload = { user: AuthUser };

function authPath(path: string): string {
  if (remoteApiEnabled()) {
    if (path === "/auth/become-creator") return "/api/v1/creators/onboard";
    if (path.startsWith("/auth/store-slug")) {
      const query = path.split("?")[1];
      return `/api/v1/creators/store-slug${query ? `?${query}` : ""}`;
    }
    return `/api/v1${path}`;
  }
  return path;
}

export async function registerAccount(
  input: SignupValues,
): Promise<AuthUser> {
  const data = await requestJson<UserPayload>(authPath("/auth/register"), {
    method: "POST",
    body: input,
  });
  return data.user;
}

export async function loginAccount(input: LoginValues): Promise<AuthUser> {
  const data = await requestJson<UserPayload>(authPath("/auth/login"), {
    method: "POST",
    body: input,
  });
  return data.user;
}

export async function logoutAccount(): Promise<void> {
  await requestJson<{ ok?: boolean }>(authPath("/auth/logout"), {
    method: "POST",
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const data = await requestJson<UserPayload>(authPath("/auth/me"), {
      method: "GET",
    });
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
  const data = await requestJson<UserPayload>(authPath("/auth/become-creator"), {
    method: "POST",
    body: input,
  });
  return data.user;
}

export async function checkStoreSlug(
  slug: string,
): Promise<{ slug: string; available: boolean }> {
  const params = new URLSearchParams({ slug });
  return requestJson(authPath(`/auth/store-slug?${params.toString()}`));
}
