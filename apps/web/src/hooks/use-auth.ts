"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  becomeCreatorAccount,
  checkStoreSlug,
  getCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
} from "@/lib/api/auth";
import type { BecomeCreatorValues, LoginValues, SignupValues } from "@/lib/auth/schema";

export const currentUserQueryKey = ["auth", "me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 30_000,
  });
}

export function useAuth() {
  const query = useCurrentUser();
  return {
    user: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError,
    isAuthenticated: Boolean(query.data),
    refetch: query.refetch,
  };
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginValues) => loginAccount(input),
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SignupValues) => registerAccount(input),
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logoutAccount(),
    onSuccess: () => {
      queryClient.setQueryData(currentUserQueryKey, null);
    },
  });
}

export function useBecomeCreatorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BecomeCreatorValues) => becomeCreatorAccount(input),
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
    },
  });
}

export function useStoreSlugAvailability(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: ["auth", "store-slug", slug],
    queryFn: () => checkStoreSlug(slug),
    enabled: enabled && slug.length >= 3,
    staleTime: 10_000,
    retry: false,
  });
}
