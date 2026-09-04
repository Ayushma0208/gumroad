import { ApiError } from "@/lib/api/client";

export function remoteApiEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_USE_REMOTE_API === "true" ||
    process.env.NEXT_PUBLIC_USE_REMOTE_AUTH === "true"
  );
}

export function apiUrl(path: string): string {
  const direct = process.env.NEXT_PUBLIC_API_DIRECT === "true";
  const remoteBase =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.API_PROXY_TARGET ??
    "http://localhost:4000";

  if (typeof window === "undefined" || direct) {
    return `${remoteBase}${path}`;
  }

  return path;
}

type Envelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: unknown;
};

export async function requestJson<T>(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const response = await fetch(apiUrl(path), {
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

  const payload: Envelope<T> | null = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload && typeof payload.message === "string" && payload.message) ||
      (payload && typeof payload.error === "string" && payload.error) ||
      response.statusText;
    throw new ApiError(response.status, message);
  }

  if (payload && payload.success === true && payload.data !== undefined) {
    return payload.data;
  }

  return payload as T;
}
