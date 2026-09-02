"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signupSchema, type SignupValues } from "@/lib/auth/schema";
import { useAuthStore } from "@/stores/auth-store";
import { homeForRole } from "@/types/auth";
import { cn } from "@/lib/utils";

const roles = [
  {
    id: "CUSTOMER" as const,
    title: "I want to buy",
    description: "Browse, purchase, and keep files in your library.",
    icon: ShoppingBag,
  },
  {
    id: "CREATOR" as const,
    title: "I want to sell",
    description: "Open a store, publish products, and see sales.",
    icon: Store,
  },
];

export function SignupForm({
  initialRole = "CUSTOMER",
}: {
  initialRole?: SignupValues["role"];
}) {
  const router = useRouter();
  const signup = useAuthStore((state) => state.signup);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<SignupValues["role"]>(initialRole);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: initialRole,
    },
  });

  function onSubmit(values: SignupValues) {
    setFormError(null);
    const result = signup(values);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    router.push(homeForRole(values.role));
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
      <fieldset>
        <legend className="mb-3 text-sm font-medium">How will you use Lumen?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {roles.map((role) => {
            const selected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setSelectedRole(role.id);
                  form.setValue("role", role.id, { shouldValidate: true });
                }}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-colors",
                  selected
                    ? "border-foreground bg-card shadow-[0_0_0_1px_var(--foreground)]"
                    : "border-border hover:border-foreground/40",
                )}
              >
                <role.icon className="size-4 text-brand" />
                <span className="mt-3 block font-medium">{role.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {role.description}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          autoComplete="name"
          placeholder="Mira Chen"
          className="h-11 rounded-xl px-3"
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
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
        {selectedRole === "CREATOR" ? "Create seller account" : "Create customer account"}
      </button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Accounts are saved in this browser until the API is connected. Use the same
        email on the{" "}
        <Link href="/login" className="underline-offset-4 hover:underline">
          sign in
        </Link>{" "}
        page to come back.
      </p>
    </form>
  );
}
