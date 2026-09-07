"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Keep SSR / pre-hydration paint readable. Never start at opacity 0 —
 * if client JS is slow or fails, opacity:0 leaves a blank page under the nav.
 */
const enter = { opacity: 0.96, y: 14 };
const visible = { opacity: 1, y: 0 };

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={enter}
      whileInView={visible}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.45, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function FadeInOnLoad({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={enter}
      animate={visible}
      transition={{ duration: 0.5, delay, ease }}
    >
      {children}
    </motion.div>
  );
}
