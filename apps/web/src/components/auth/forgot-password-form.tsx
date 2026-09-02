"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/auth/schema";
import { useToastStore } from "@/stores/toast-store";

export function ForgotPasswordForm() {
  const showToast = useToastStore((state) => state.show);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: "" },
  });

  function onSubmit() {
    showToast({
      title: "Reset is not connected yet",
      description: "Password email will send from the Express auth module.",
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@studio.com"
          className="h-12 rounded-xl px-3"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        size="xl"
        className="w-full rounded-xl"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <LoaderCircle className="animate-spin" />
        ) : null}
        Send reset link
      </Button>
    </form>
  );
}
