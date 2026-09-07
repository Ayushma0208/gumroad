"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-7xl", className)}>{children}</div>;
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  variant = "outline",
  disabled,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  variant?: "outline" | "destructive" | "default";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
        variant === "destructive"
          ? "border-destructive/40 text-destructive hover:bg-destructive/10"
          : "border-border hover:bg-muted",
      )}
      onClick={() => {
        if (window.confirm(confirmLabel)) onConfirm();
      }}
    >
      {label}
    </button>
  );
}

export function AdminListPagination({
  page,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        disabled={!hasPreviousPage}
        onClick={onPrevious}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        disabled={!hasNextPage}
        onClick={onNext}
      >
        Next
      </Button>
    </div>
  );
}
