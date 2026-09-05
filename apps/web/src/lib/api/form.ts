import { apiUrl } from "@/lib/api/http";
import { ApiError } from "@/lib/api/client";

type Envelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

export async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const payload: Envelope<T> | null = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      (payload && payload.message) || response.statusText,
    );
  }
  if (payload && payload.success === true && payload.data !== undefined) {
    return payload.data;
  }
  return payload as T;
}
