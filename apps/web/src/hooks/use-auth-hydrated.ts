"use client";

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/stores/auth-store";

function subscribeHydration(onChange: () => void) {
  return useAuthStore.persist.onFinishHydration(onChange);
}

export function useAuthHydrated() {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    if (!useAuthStore.persist.hasHydrated()) {
      void useAuthStore.persist.rehydrate();
    }
  }, []);

  return hydrated;
}
