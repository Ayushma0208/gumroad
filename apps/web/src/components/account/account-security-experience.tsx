"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useChangePassword, useCloseAccount } from "@/hooks/use-account";
import { ApiError } from "@/lib/api/client";
import { isCreatorRole } from "@/types/auth";
import { useToastStore } from "@/stores/toast-store";
import { useRouter } from "next/navigation";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Za-z]/, "Include a letter.")
      .regex(/[0-9]/, "Include a number."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export function AccountSecurityExperience() {
  const { user } = useAuth();
  const change = useChangePassword();
  const close = useCloseAccount();
  const showToast = useToastStore((state) => state.show);
  const router = useRouter();
  const [closePassword, setClosePassword] = useState("");
  const [closeConfirm, setCloseConfirm] = useState(false);

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onTouched",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  if (!user) return null;
  const creator = isCreatorRole(user.role);

  async function onSubmit(values: PasswordValues) {
    try {
      await change.mutateAsync(values);
      showToast({ title: "Password updated" });
      form.reset();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Couldn’t change password.";
      form.setError("root", { message });
    }
  }

  async function onCloseAccount() {
    try {
      await close.mutateAsync({
        password: closePassword,
        confirm: closeConfirm,
      });
      showToast({ title: "Account closed" });
      router.push("/");
      router.refresh();
    } catch (error) {
      showToast({
        title: "Couldn’t close account",
        description:
          error instanceof ApiError ? error.message : "Try again later.",
      });
    }
  }

  return (
    <div className="max-w-xl space-y-12">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Security</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Change your password. Sessions are JWT cookies — signing out clears this
          device’s cookie. Device lists are not available yet.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <h2 className="text-base font-medium">Change password</h2>
        <PasswordField
          id="currentPassword"
          label="Current password"
          autoComplete="current-password"
          error={form.formState.errors.currentPassword?.message}
          registration={form.register("currentPassword")}
        />
        <PasswordField
          id="newPassword"
          label="New password"
          autoComplete="new-password"
          error={form.formState.errors.newPassword?.message}
          registration={form.register("newPassword")}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          error={form.formState.errors.confirmPassword?.message}
          registration={form.register("confirmPassword")}
        />
        {form.formState.errors.root ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <Button type="submit" className="rounded-xl" disabled={change.isPending}>
          {change.isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          Update password
        </Button>
      </form>

      <section className="rounded-xl border border-border px-4 py-5">
        <h2 className="text-base font-medium">Close account</h2>
        {creator ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Creator accounts cannot be closed here. Contact support so products and
            sales records stay intact.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              This anonymizes your personal details and suspends login. Orders and
              purchases are retained for records. This cannot be undone from the app.
            </p>
            <div className="mt-4 space-y-3">
              <Input
                type="password"
                placeholder="Confirm with your password"
                value={closePassword}
                onChange={(event) => setClosePassword(event.target.value)}
                className="h-11 rounded-xl"
                autoComplete="current-password"
              />
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={closeConfirm}
                  onChange={(event) => setCloseConfirm(event.target.checked)}
                />
                I understand this closes my account permanently.
              </label>
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                disabled={
                  close.isPending || !closePassword || !closeConfirm
                }
                onClick={() => void onCloseAccount()}
              >
                {close.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                Close account
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
