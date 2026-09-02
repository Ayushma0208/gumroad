"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginValues } from "@/lib/auth/schema";
import { useAuthStore } from "@/stores/auth-store";
import { homeForRole } from "@/types/auth";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginValues) {
    setFormError(null);
    const result = login(values.email, values.password);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    const user = useAuthStore.getState().user;
    router.push(user ? homeForRole(user.role) : "/");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@studio.com"
          className="h-11 rounded-xl px-3"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-11 rounded-xl px-3"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      <button
        type="submit"
        className={cn(buttonVariants({ size: "xl" }), "w-full rounded-xl")}
      >
        Sign in
      </button>
    </form>
  );
}
