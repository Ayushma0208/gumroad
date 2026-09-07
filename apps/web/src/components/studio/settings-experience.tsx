"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Field } from "@/components/studio/field";
import { AvatarUploader, BannerUploader } from "@/components/studio/media-uploader";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import {
  SocialLinksForm,
  StoreProfileForm,
  StoreSlugInput,
  StoreUrlCard,
} from "@/components/studio/store-settings-forms";
import { StudioPage } from "@/components/studio/studio-page";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateCreatorBranding } from "@/hooks/use-creator";
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
import { ApiError } from "@/lib/api/client";

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
        Storefront identity, branding, and how buyers find you.{" "}
        <Link
          href="/dashboard/settings/payouts"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Payout settings
        </Link>
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
  const branding = useUpdateCreatorBranding();
  const showToast = useToastStore((state) => state.show);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<StudioSettingsValues>({
    resolver: zodResolver(studioSettingsSchema),
    mode: "onTouched",
    defaultValues,
  });

  const avatarUrl = useWatch({ control: form.control, name: "avatarUrl" });
  const bannerUrl = useWatch({ control: form.control, name: "bannerUrl" });
  const notifySales = useWatch({ control: form.control, name: "notifySales" });
  const notifyProductUpdates = useWatch({
    control: form.control,
    name: "notifyProductUpdates",
  });
  const notifyWeeklyDigest = useWatch({
    control: form.control,
    name: "notifyWeeklyDigest",
  });
  const slug = useWatch({ control: form.control, name: "slug" });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  return (
    <form
      className="mt-10 space-y-12"
      onSubmit={form.handleSubmit(async (values) => {
        setServerError(null);
        try {
          await save.mutateAsync({
            ...values,
            storeDescription: values.description || values.storeDescription,
          });
          showToast({ title: "Settings saved" });
        } catch (error) {
          const message =
            error instanceof ApiError ? error.message : "Could not save settings.";
          setServerError(message);
        }
      })}
      noValidate
    >
      <StoreUrlCard slug={slug || defaultValues.slug} />

      <StoreProfileForm register={form.register} errors={form.formState.errors} />
      <StoreSlugInput form={form} currentSlug={defaultValues.slug} />

      <section>
        <h2 className="text-base font-medium">Store branding</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Avatar and banner use the same image upload as your products.
        </p>
        <div className="mt-5 space-y-6">
          <Field label="Avatar">
            <AvatarUploader
              value={avatarUrl}
              onChange={(url) => {
                form.setValue("avatarUrl", url, { shouldDirty: true });
                branding.invalidate();
              }}
            />
          </Field>
          <Field label="Banner">
            <BannerUploader
              value={bannerUrl}
              onChange={(url) => {
                form.setValue("bannerUrl", url, { shouldDirty: true });
                branding.invalidate();
              }}
            />
          </Field>
        </div>
      </section>

      <SocialLinksForm register={form.register} errors={form.formState.errors} />

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

      {serverError ? (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="rounded-xl" disabled={save.isPending}>
        {save.isPending ? <LoaderCircle className="animate-spin" /> : null}
        {save.isPending ? "Saving…" : "Save settings"}
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
