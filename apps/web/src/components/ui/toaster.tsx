"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useToastStore } from "@/stores/toast-store";

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-8">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-lg"
          >
            <p className="font-medium">{toast.title}</p>
            {toast.description ? (
              <p className="mt-0.5 text-muted-foreground">{toast.description}</p>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
