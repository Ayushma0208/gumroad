const STORAGE_KEY = "lumen.recentSearches";
const MAX_RECENT = 8;

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function pushRecentSearch(term: string) {
  const normalized = term.trim().replace(/\s+/g, " ").slice(0, 80);
  if (normalized.length < 2) return;
  const next = [
    normalized,
    ...readRecentSearches().filter(
      (item) => item.toLowerCase() !== normalized.toLowerCase(),
    ),
  ].slice(0, MAX_RECENT);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearRecentSearches() {
  window.localStorage.removeItem(STORAGE_KEY);
}
