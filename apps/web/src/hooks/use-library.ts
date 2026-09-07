"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLibrary,
  getLibraryProduct,
  requestDownload,
} from "@/lib/api/library";
import { requestJson } from "@/lib/api/http";
import { useAuth } from "@/hooks/use-auth";
import { purchasesQueryKey } from "@/hooks/use-checkout";

export const libraryQueryKey = ["library"] as const;
export const libraryProductKey = (id: string) => ["library", id] as const;
export const libraryKeys = {
  ids: ["library", "ids"] as const,
};

export function useLibrary() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: libraryQueryKey,
    queryFn: () => getLibrary(),
    enabled: isAuthenticated,
  });
}

export function useLibraryProduct(productId: string | undefined) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: libraryProductKey(productId ?? ""),
    queryFn: () => getLibraryProduct(productId as string),
    enabled: isAuthenticated && Boolean(productId),
    retry: false,
  });
}

export function useRequestDownload(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => requestDownload(productId, fileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchasesQueryKey });
    },
  });
}

export function useLibraryIds() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: libraryKeys.ids,
    queryFn: () =>
      requestJson<{ productIds: string[] }>("/api/v1/library/ids"),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useOwnsProduct(productId: string | undefined) {
  const ids = useLibraryIds();
  if (!productId) return false;
  return Boolean(ids.data?.productIds.includes(productId));
}
