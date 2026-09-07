"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changePassword,
  closeAccount,
  deleteUserAvatar,
  fetchMyReviews,
  updateProfile,
  uploadUserAvatar,
} from "@/lib/api/account";
import { currentUserQueryKey } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import type { AuthUser } from "@/types/auth";

export const accountKeys = {
  reviews: (page: number) => ["account", "reviews", page] as const,
};

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      qc.setQueryData(currentUserQueryKey, user);
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadUserAvatar,
    onSuccess: (data) => {
      qc.setQueryData<AuthUser | null>(currentUserQueryKey, (current) =>
        current ? { ...current, avatarUrl: data.avatarUrl } : current,
      );
    },
  });
}

export function useDeleteAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUserAvatar,
    onSuccess: () => {
      qc.setQueryData<AuthUser | null>(currentUserQueryKey, (current) =>
        current ? { ...current, avatarUrl: null } : current,
      );
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}

export function useCloseAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: closeAccount,
    onSuccess: () => {
      qc.setQueryData(currentUserQueryKey, null);
      qc.clear();
    },
  });
}

export function useMyReviews(page = 1) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: accountKeys.reviews(page),
    queryFn: () => fetchMyReviews({ page, limit: 20 }),
    enabled: isAuthenticated,
  });
}
