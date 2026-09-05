"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Field } from "@/components/studio/field";
import { AvatarUploader } from "@/components/studio/media-uploader";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { StudioPage } from "@/components/studio/studio-page";
import { Textarea } from "@/components/studio/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  useDeactivateStoreMutation,
  useSaveSettingsMutation,
  useStudioSettings,
} from "@/hooks/use-studio";
import {
  studioSettingsSchema,
  type StudioSettingsValues,
} from "@/lib/studio/schema";
import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

export function SettingsExperience() {
  const { user } = useAuth();
  const query = useStudioSettings(user?.id);

  if (query.isPending) {
    return (
      <StudioPage className="max-w-2xl">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Settings</h1>
        <div className="mt-8">
          <TableSkeleton rows={4} />
        </div>
      </StudioPage>
    );
  }

  if (query.isError || !query.data || !user) {
    return (
      <StudioPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </StudioPage>
    );
  }

  return (
    <StudioPage className="max-w-2xl">
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        How buyers see the store, and how we write to you.
      </p>
      <SettingsForm userId={user.id} defaultValues={query.data} />
    </StudioPage>
  );
}

function SettingsForm({
  userId,
  defaultValues,
}: {
  userId: string;
  defaultValues: StudioSettingsValues;
}) {
  const save = useSaveSettingsMutation(userId);
  const deactivate = useDeactivateStoreMutation(userId);
  const showToast = useToastStore((state) => state.show);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const form = useForm<StudioSettingsValues>({
    resolver: zodResolver(studioSettingsSchema),
    mode: "onTouched",
    defaultValues,
  });

  const avatarUrl = useWatch({ control: form.control, name: "avatarUrl" });
  const notifySales = useWatch({ control: form.control, name: "notifySales" });
  const notifyProductUpdates = useWatch({
    control: form.control,
    name: "notifyProductUpdates",
  });
  const notifyWeeklyDigest = useWatch({
    control: form.control,
    name: "notifyWeeklyDigest",
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  return (
    <form
      className="mt-10 space-y-12"
      onSubmit={form.handleSubmit(async (values) => {
        await save.mutateAsync(values);
        showToast({ title: "Settings saved" });
      })}
      noValidate
    >
      <section>
        <h2 className="text-base font-medium">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Name and portrait on your public page.
        </p>
        <div className="mt-5 space-y-5">
          <Field label="Avatar">
            <AvatarUploader
              value={avatarUrl}
              onChange={(url) => form.setValue("avatarUrl", url, { shouldDirty: true })}
            />
          </Field>
          <Field
            id="displayName"
            label="Display name"
            error={form.formState.errors.displayName?.message}
          >
            <Input
              id="displayName"
              className="h-11 rounded-xl"
              {...form.register("displayName")}
            />
          </Field>
          <Field id="bio" label="Bio" error={form.formState.errors.bio?.message}>
            <Textarea id="bio" {...form.register("bio")} />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-base font-medium">Store</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The storefront URL and how it reads on Discover.
        </p>
        <div className="mt-5 space-y-5">
          <Field
            id="storeName"
            label="Store name"
            error={form.formState.errors.storeName?.message}
          >
            <Input
              id="storeName"
              className="h-11 rounded-xl"
              {...form.register("storeName")}
            />
          </Field>
          <Field
            id="slug"
            label="Store URL"
            error={form.formState.errors.slug?.message}
          >
            <div className="flex overflow-hidden rounded-xl border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground">
                lumen.app/
              </span>
              <input
                id="slug"
                className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                {...form.register("slug")}
              />
            </div>
          </Field>
          <Field
            id="storeDescription"
            label="Store description"
            error={form.formState.errors.storeDescription?.message}
          >
            <Textarea id="storeDescription" {...form.register("storeDescription")} />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-base font-medium">Preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">Email from Lumen.</p>
        <div className="mt-5 space-y-3">
          <Toggle
            label="Sale receipts"
            hint="When someone buys a product."
            checked={notifySales}
            onChange={(value) => form.setValue("notifySales", value, { shouldDirty: true })}
          />
          <Toggle
            label="Product updates"
            hint="When a draft is published or a file changes."
            checked={notifyProductUpdates}
            onChange={(value) =>
              form.setValue("notifyProductUpdates", value, { shouldDirty: true })
            }
          />
          <Toggle
            label="Weekly digest"
            hint="A quiet Monday summary. Off by default."
            checked={notifyWeeklyDigest}
            onChange={(value) =>
              form.setValue("notifyWeeklyDigest", value, { shouldDirty: true })
            }
          />
        </div>
      </section>

      <Button type="submit" size="lg" className="rounded-xl" disabled={save.isPending}>
        {save.isPending ? <LoaderCircle className="animate-spin" /> : null}
        Save settings
      </Button>

      <section className="rounded-2xl border border-destructive/30 p-5">
        <h2 className="text-base font-medium text-destructive">Danger zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Archive the storefront. Products stay in the catalog as archived; buyers keep files.
        </p>
        {confirmArchive ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmArchive(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deactivate.isPending}
              onClick={() =>
                void deactivate.mutateAsync().then(() => {
                  showToast({ title: "Store archived" });
                  setConfirmArchive(false);
                })
              }
            >
              {deactivate.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Archive store
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="destructive"
            className="mt-4"
            onClick={() => setConfirmArchive(true)}
          >
            Archive store
          </Button>
        )}
      </section>
    </form>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl px-1 py-2">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
          checked ? "bg-foreground" : "bg-muted ring-1 ring-foreground/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-background transition-[left]",
            checked ? "left-[1.125rem]" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}
