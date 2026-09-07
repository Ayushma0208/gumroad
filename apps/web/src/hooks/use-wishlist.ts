"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  addWishlistItem,
  clearWishlist,
  getWishlist,
  getWishlistProductIds,
  getWishlistStatus,
  removeWishlistItem,
  type WishlistSort,
} from "@/lib/api/wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useToastStore } from "@/stores/toast-store";

export const wishlistKeys = {
  all: ["wishlist"] as const,
  list: (params: Record<string, unknown>) =>
    ["wishlist", "list", params] as const,
  ids: ["wishlist", "ids"] as const,
  status: (ids: string[]) => ["wishlist", "status", ids.slice().sort()] as const,
};

function patchIds(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: string,
  wishlisted: boolean,
) {
  queryClient.setQueryData<{ productIds: string[] }>(wishlistKeys.ids, (current) => {
    const ids = current?.productIds ?? [];
    if (wishlisted) {
      if (ids.includes(productId)) return current ?? { productIds: ids };
      return { productIds: [productId, ...ids] };
    }
    return { productIds: ids.filter((id) => id !== productId) };
  });
}

export function useWishlist(params: {
  page?: number;
  limit?: number;
  sort?: WishlistSort;
  search?: string;
} = {}) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: wishlistKeys.list(params),
    queryFn: () => getWishlist(params),
    enabled: isAuthenticated,
    staleTime: 15_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status < 500) return false;
      return failureCount < 1;
    },
  });
}

export function useWishlistIds() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: wishlistKeys.ids,
    queryFn: getWishlistProductIds,
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status < 500) return false;
      return failureCount < 1;
    },
  });
}

export function useWishlistCount() {
  const ids = useWishlistIds();
  return ids.data?.productIds.length ?? 0;
}

export function useIsWishlisted(productId: string | undefined) {
  const ids = useWishlistIds();
  if (!productId) return false;
  return Boolean(ids.data?.productIds.includes(productId));
}

export function useWishlistStatuses(productIds: string[]) {
  const { isAuthenticated } = useAuth();
  const key = productIds.slice().sort();
  return useQuery({
    queryKey: wishlistKeys.status(key),
    queryFn: () => getWishlistStatus(key),
    enabled: isAuthenticated && key.length > 0,
    staleTime: 30_000,
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const toast = useToastStore((state) => state.show);

  return useMutation({
    mutationFn: async (input: { productId: string; wishlisted: boolean }) => {
      if (input.wishlisted) {
        await removeWishlistItem(input.productId);
        return { productId: input.productId, wishlisted: false };
      }
      await addWishlistItem(input.productId);
      return { productId: input.productId, wishlisted: true };
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.all });
      const previous = queryClient.getQueryData<{ productIds: string[] }>(
        wishlistKeys.ids,
      );
      patchIds(queryClient, input.productId, !input.wishlisted);
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(wishlistKeys.ids, context.previous);
      }
      const message =
        error instanceof ApiError
          ? error.message
          : "Couldn’t update your wishlist.";
      toast({ title: message });
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      if (!result.wishlisted) {
        toast({ title: "Removed from wishlist" });
      }
    },
  });
}

export function useAddToWishlist() {
  const toggle = useToggleWishlist();
  return {
    ...toggle,
    mutateAsync: (productId: string) =>
      toggle.mutateAsync({ productId, wishlisted: false }),
  };
}

export function useRemoveFromWishlist() {
  const toggle = useToggleWishlist();
  return {
    ...toggle,
    mutateAsync: (productId: string) =>
      toggle.mutateAsync({ productId, wishlisted: true }),
  };
}

export function useClearWishlist() {
  const queryClient = useQueryClient();
  const toast = useToastStore((state) => state.show);
  return useMutation({
    mutationFn: clearWishlist,
    onSuccess: () => {
      queryClient.setQueryData(wishlistKeys.ids, { productIds: [] });
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      toast({ title: "Wishlist cleared" });
    },
    onError: (error) => {
      toast({
        title:
          error instanceof ApiError
            ? error.message
            : "Couldn’t clear your wishlist.",
      });
    },
  });
}
