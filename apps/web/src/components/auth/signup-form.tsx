"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { signupSchema, type SignupValues } from "@/lib/auth/schema";
import { safeNextPath } from "@/lib/auth/paths";
import { useRegisterMutation } from "@/hooks/use-auth";
import { homeForRole } from "@/types/auth";
import { useToastStore } from "@/stores/toast-store";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"), "");
  const registerAccount = useRegisterMutation();
  const showToast = useToastStore((state) => state.show);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });
  const password = useWatch({ control: form.control, name: "password" });

  async function onSubmit(values: SignupValues) {
    try {
      const user = await registerAccount.mutateAsync(values);
      showToast({
        title: "Account created",
        description: "You’re in. Welcome to Lumen.",
      });
      router.push(next || homeForRole(user.role));
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "We couldn’t create your account. Try again.";
      form.setError("root", { message });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          autoComplete="name"
          placeholder="Mira Chen"
          aria-invalid={Boolean(form.formState.errors.name)}
          className="h-12 rounded-xl px-3"
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

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
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={form.formState.errors.password?.message}
        registration={form.register("password")}
      />
      <PasswordStrength password={password} />

      <PasswordField
        id="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        error={form.formState.errors.confirmPassword?.message}
        registration={form.register("confirmPassword")}
      />

      <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-border accent-foreground"
          aria-invalid={Boolean(form.formState.errors.terms)}
          {...form.register("terms")}
        />
        <span>
          I agree to Lumen’s{" "}
          <Link href="/terms" className="text-foreground underline-offset-4 hover:underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-foreground underline-offset-4 hover:underline">
            privacy policy
          </Link>
          . Accounts start as a customer — you can open a store later.
        </span>
      </label>
      {form.formState.errors.terms ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.terms.message}
        </p>
      ) : null}

      {form.formState.errors.root ? (
        <p className="text-sm text-destructive" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}

      <Button
        type="submit"
        size="xl"
        className="w-full rounded-xl"
        disabled={registerAccount.isPending}
      >
        {registerAccount.isPending ? (
          <LoaderCircle className="animate-spin" />
        ) : null}
        Create account
      </Button>

      <SocialAuthButtons />
    </form>
  );
}
