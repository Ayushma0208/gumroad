"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkCreatorSlug,
  getCreatorBySlug,
  getCreatorProducts,
  getMyCreator,
  listCreators,
  updateCreatorProfile,
  type CreatorSort,
  type UpdateCreatorProfileInput,
} from "@/lib/api/creators";
import { currentUserQueryKey } from "@/hooks/use-auth";
import { studioKeys } from "@/hooks/use-studio";
import type { CreatorStorePayload } from "@/types/catalog";

export const creatorKeys = {
  public: (slug: string) => ["creator", slug] as const,
  products: (slug: string, params: Record<string, unknown>) =>
    ["creator", slug, "products", params] as const,
  featured: (slug: string) => ["creator", slug, "featured"] as const,
  directory: (exclude?: string) => ["creators", "directory", exclude ?? ""] as const,
  me: ["creator", "me"] as const,
  slug: (value: string) => ["creator", "slug", value] as const,
};

export function useCreator(slug: string, initialData?: CreatorStorePayload) {
  return useQuery({
    queryKey: creatorKeys.public(slug),
    queryFn: async () => {
      const payload = await getCreatorBySlug(slug);
      if (!payload) throw new Error("Creator not found");
      return payload;
    },
    initialData,
    enabled: Boolean(slug),
    staleTime: 30_000,
  });
}

export function useCreatorProducts(
  slug: string,
  params: { sort?: CreatorSort; page?: number; limit?: number; featured?: boolean },
) {
  return useQuery({
    queryKey: creatorKeys.products(slug, params),
    queryFn: () => getCreatorProducts(slug, params),
    enabled: Boolean(slug),
    staleTime: 30_000,
  });
}

export function useOtherCreators(excludeSlug: string, enabled: boolean) {
  return useQuery({
    queryKey: creatorKeys.directory(excludeSlug),
    queryFn: () => listCreators({ limit: 4, exclude: excludeSlug }),
    enabled,
    staleTime: 60_000,
  });
}

export function useMyCreator() {
  return useQuery({
    queryKey: creatorKeys.me,
    queryFn: getMyCreator,
    staleTime: 15_000,
  });
}

export function useUpdateCreatorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCreatorProfileInput) => updateCreatorProfile(input),
    onSuccess: (data) => {
      queryClient.setQueryData(creatorKeys.me, {
        creator: data.creator,
        stats: data.stats,
      });
      queryClient.setQueryData(creatorKeys.public(data.creator.slug), {
        creator: data.creator,
        stats: data.stats,
      });
      if (data.user) {
        queryClient.setQueryData(currentUserQueryKey, data.user);
      } else {
        void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      }
      void queryClient.invalidateQueries({ queryKey: ["studio"] });
      void queryClient.invalidateQueries({ queryKey: studioKeys.settings("") });
    },
  });
}

export function useCheckCreatorSlug(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: creatorKeys.slug(slug),
    queryFn: () => checkCreatorSlug(slug),
    enabled: enabled && slug.length >= 3,
    staleTime: 10_000,
    retry: false,
  });
}

export function useUpdateCreatorBranding() {
  const queryClient = useQueryClient();
  return {
    invalidate: () => {
      void queryClient.invalidateQueries({ queryKey: creatorKeys.me });
      void queryClient.invalidateQueries({ queryKey: ["creator"] });
      void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  };
}
