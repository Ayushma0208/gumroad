"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PasswordField } from "@/components/auth/password-field";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { loginSchema, type LoginValues } from "@/lib/auth/schema";
import { safeNextPath } from "@/lib/auth/paths";
import { useLoginMutation } from "@/hooks/use-auth";
import { homeForRole } from "@/types/auth";
import { useToastStore } from "@/stores/toast-store";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(
    searchParams.get("next") ?? searchParams.get("redirect"),
    "",
  );
  const login = useLoginMutation();
  const showToast = useToastStore((state) => state.show);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    try {
      const user = await login.mutateAsync(values);
      showToast({ title: "Welcome back", description: user.name });
      router.push(next || homeForRole(user.role));
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "We couldn’t sign you in. Try again.";
      form.setError("root", { message });
    }
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
          aria-invalid={Boolean(form.formState.errors.email)}
          className="h-12 rounded-xl px-3"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <PasswordField
        id="password"
        label="Password"
        autoComplete="current-password"
        error={form.formState.errors.password?.message}
        registration={form.register("password")}
      />

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {form.formState.errors.root ? (
        <p className="text-sm text-destructive" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}

      <Button
        type="submit"
        size="xl"
        className="w-full rounded-xl"
        disabled={login.isPending}
      >
        {login.isPending ? <LoaderCircle className="animate-spin" /> : null}
        Sign in
      </Button>

      <SocialAuthButtons />
    </form>
  );
}
