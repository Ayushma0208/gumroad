"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserAvatar } from "@/components/auth/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  useDeleteAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from "@/hooks/use-account";
import { ApiError } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast-store";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function AccountProfileExperience() {
  const { user } = useAuth();
  const update = useUpdateProfile();
  const upload = useUploadAvatar();
  const remove = useDeleteAvatar();
  const showToast = useToastStore((state) => state.show);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    values: { name: user?.name ?? "" },
  });

  if (!user) return null;

  async function onSubmit(values: ProfileValues) {
    try {
      await update.mutateAsync(values);
      showToast({ title: "Profile updated" });
      form.reset(values);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Couldn’t save profile.";
      form.setError("root", { message });
    }
  }

  async function onAvatarChange(file: File | undefined) {
    if (!file) return;
    try {
      await upload.mutateAsync(file);
      showToast({ title: "Avatar updated" });
    } catch (error) {
      showToast({
        title: "Avatar upload failed",
        description:
          error instanceof ApiError ? error.message : "Try a smaller JPG or PNG.",
      });
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl tracking-tight">Profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your public display name and avatar. Email changes require a verified flow and
        are not available here yet.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <UserAvatar user={user} size="md" />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={upload.isPending}
            onClick={() => fileRef.current?.click()}
          >
            {upload.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Upload photo
          </Button>
          {user.avatarUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() =>
                void remove.mutateAsync().then(() =>
                  showToast({ title: "Avatar removed" }),
                )
              }
            >
              Remove
            </Button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              void onAvatarChange(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-8 space-y-4"
        noValidate
      >
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            autoComplete="name"
            className="h-11 rounded-xl"
            aria-invalid={Boolean(form.formState.errors.name)}
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
            value={user.email}
            disabled
            className="h-11 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">
            Contact support to change the email on this account.
          </p>
        </div>

        {form.formState.errors.root ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <Button
          type="submit"
          className="rounded-xl"
          disabled={update.isPending || !form.formState.isDirty}
        >
          {update.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Save changes
        </Button>
      </form>
    </div>
  );
}
