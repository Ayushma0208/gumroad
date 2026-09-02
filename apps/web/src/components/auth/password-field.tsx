"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PasswordField({
  id,
  label,
  autoComplete,
  error,
  registration,
  placeholder = "••••••••",
}: {
  id: string;
  label: string;
  autoComplete: string;
  error?: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={cn("h-12 rounded-xl px-3 pr-12")}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
