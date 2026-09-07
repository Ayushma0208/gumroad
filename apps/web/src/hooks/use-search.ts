"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSearchSuggestions } from "@/lib/api/search";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export const searchKeys = {
  suggest: (q: string) => ["search", "suggest", q] as const,
};

export function useSearchSuggestions(query: string, enabled = true) {
  const debounced = useDebouncedValue(query.trim(), 250);
  return useQuery({
    queryKey: searchKeys.suggest(debounced),
    queryFn: () => fetchSearchSuggestions(debounced, 5),
    enabled: enabled && debounced.length >= 2,
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}
