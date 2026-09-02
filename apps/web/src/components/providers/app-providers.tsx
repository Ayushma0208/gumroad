"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthRehydrator } from "@/components/providers/auth-rehydrator";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthRehydrator />
      <QueryProvider>
        <TooltipProvider delay={200}>{children}</TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
