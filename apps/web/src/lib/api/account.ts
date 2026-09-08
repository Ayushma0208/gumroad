import { requestForm } from "@/lib/api/form";
import { requestJson } from "@/lib/api/http";
import type { AuthUser } from "@/types/auth";

export async function updateProfile(input: { name: string }) {
  const data = await requestJson<{ user: AuthUser }>("/api/v1/users/me", {
    method: "PATCH",
    body: input,
  });
  return data.user;
}

export async function uploadUserAvatar(file: File) {
  const body = new FormData();
  body.append("file", file);
  return requestForm<{ avatarUrl: string | null }>("/api/v1/users/me/avatar", body);
}

export async function deleteUserAvatar() {
  return requestJson<{ avatarUrl: null }>("/api/v1/users/me/avatar", {
    method: "DELETE",
  });
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return requestJson<{ ok: boolean }>("/api/v1/auth/change-password", {
    method: "POST",
    body: input,
  });
}

export async function closeAccount(input: {
  password: string;
  confirm: boolean;
}) {
  return requestJson<{ ok: boolean }>("/api/v1/users/me", {
    method: "DELETE",
    body: input,
  });
}

export type MyReview = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  verifiedPurchase: boolean;
  status?: string;
  product?: { id: string; title: string; slug: string };
};

export async function fetchMyReviews(params: { page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  return requestJson<{
    items: MyReview[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>(`/api/v1/users/me/reviews?${search.toString()}`);
}
