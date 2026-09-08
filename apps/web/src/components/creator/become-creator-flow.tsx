"use client";

import { ArrowRight, Check, LoaderCircle, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { UserAvatar } from "@/components/auth/user-avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeInOnLoad } from "@/components/motion/fade-in";
import { useUploadAvatar } from "@/hooks/use-account";
import { useBecomeCreatorMutation, useStoreSlugAvailability } from "@/hooks/use-auth";
import { useCatalogCategories } from "@/hooks/use-catalog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/client";
import {
  creatorProfileSchema,
  storeSetupSchema,
  type BecomeCreatorValues,
} from "@/lib/auth/schema";
import { slugifyStore } from "@/lib/auth/slug";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast-store";
import type { AuthUser } from "@/types/auth";
import { isCreatorRole } from "@/types/auth";

const steps = ["Welcome", "Profile", "Store", "Ready"] as const;

export function BecomeCreatorFlow({ user }: { user: AuthUser }) {
  const router = useRouter();
  const become = useBecomeCreatorMutation();
  const uploadAvatar = useUploadAvatar();
  const showToast = useToastStore((state) => state.show);
  const categoriesQuery = useCatalogCategories();
  const categories = categoriesQuery.data ?? [];
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [openingStore, setOpeningStore] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof BecomeCreatorValues, string>>
  >({});
  const [slugTouched, setSlugTouched] = useState(false);
  const localPreviewRef = useRef<string | null>(null);
  const [values, setValues] = useState<BecomeCreatorValues>({
    displayName: user.name,
    storeName: "",
    bio: "",
    slug: "",
    category: "design",
    avatarUrl: user.avatarUrl ?? "",
  });

  const debouncedSlug = useDebouncedValue(values.slug, 400);
  const slugQuery = useStoreSlugAvailability(
    debouncedSlug,
    step === 2 && debouncedSlug.length >= 3,
  );

  const previewUser = useMemo<AuthUser>(
    () => ({
      ...user,
      name: values.displayName || user.name,
      avatarUrl: values.avatarUrl || user.avatarUrl,
    }),
    [user, values.avatarUrl, values.displayName],
  );

  const slugPending =
    step === 2 && (slugQuery.isFetching || debouncedSlug !== values.slug);
  const slugTaken = step === 2 && slugQuery.data && !slugQuery.data.available;
  const busy = openingStore || become.isPending || avatarUploading;

  useEffect(() => {
    return () => {
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current);
      }
    };
  }, []);

  if (isCreatorRole(user.role) && step !== 3) {
    return (
      <ReadyStep
        storeName={user.creatorProfile?.storeName ?? "your store"}
        already
      />
    );
  }

  function update<K extends keyof BecomeCreatorValues>(
    key: K,
    value: BecomeCreatorValues[K],
  ) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === "storeName" && !slugTouched) {
        next.slug = slugifyStore(String(value));
      }
      return next;
    });
  }

  function onPickFile(file: File | undefined) {
    if (!file) return;
    void (async () => {
      setAvatarError(null);
      setError(null);
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current);
        localPreviewRef.current = null;
      }
      const preview = URL.createObjectURL(file);
      localPreviewRef.current = preview;
      update("avatarUrl", preview);
      setAvatarUploading(true);
      try {
        const uploaded = await uploadAvatar.mutateAsync(file);
        if (uploaded.avatarUrl) {
          update("avatarUrl", uploaded.avatarUrl);
        }
      } catch (uploadError) {
        update("avatarUrl", user.avatarUrl ?? "");
        setAvatarError(
          uploadError instanceof ApiError
            ? uploadError.message
            : "Couldn’t upload that photo. Try a smaller JPG or PNG.",
        );
      } finally {
        setAvatarUploading(false);
        window.setTimeout(() => {
          URL.revokeObjectURL(preview);
          if (localPreviewRef.current === preview) {
            localPreviewRef.current = null;
          }
        }, 400);
      }
    })();
  }

  async function onContinue() {
    setError(null);
    setFieldErrors({});
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      const parsed = creatorProfileSchema.safeParse(values);
      if (!parsed.success) {
        setFieldErrors(issuesToFields(parsed.error.issues));
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const parsed = storeSetupSchema.safeParse(values);
      if (!parsed.success) {
        setFieldErrors(issuesToFields(parsed.error.issues));
        return;
      }
      if (debouncedSlug !== values.slug || slugQuery.isFetching) {
        setError("Give us a moment to check that URL.");
        return;
      }
      if (slugQuery.data && !slugQuery.data.available) {
        setError("That store URL is taken. Try another.");
        return;
      }
      if (avatarUploading) {
        setError("Wait for the photo to finish uploading.");
        return;
      }
      try {
        setOpeningStore(true);
        const avatarUrl = publicHttpUrl(values.avatarUrl);
        await become.mutateAsync({
          ...values,
          avatarUrl,
        });
        showToast({
          title: "Your store is live",
          description: values.storeName,
        });
        router.refresh();
        setStep(3);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "We couldn’t open your store. Try again.",
        );
      } finally {
        setOpeningStore(false);
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <ol className="mb-12 flex gap-2 sm:gap-3">
        {steps.map((label, index) => (
          <li key={label} className="flex-1">
            <p
              className={cn(
                "text-[11px] font-medium tracking-[0.14em] uppercase",
                index <= step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              0{index + 1} {label}
            </p>
            <span
              className={cn(
                "mt-2 block h-px w-full",
                index <= step ? "bg-foreground" : "bg-border",
              )}
            />
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <FadeInOnLoad>
          <WelcomeStep />
        </FadeInOnLoad>
      ) : null}

      {step === 1 ? (
        <FadeInOnLoad>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.85fr)] lg:gap-16">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
              Profile
            </p>
            <h1 className="mt-3 font-display text-4xl tracking-tight">
              How should people find you?
            </h1>
            <div className="mt-8 space-y-4">
              <Field
                id="displayName"
                label="Display name"
                value={values.displayName}
                onChange={(value) => update("displayName", value)}
                error={fieldErrors.displayName}
              />
              <Field
                id="storeName"
                label="Store name"
                value={values.storeName}
                onChange={(value) => update("storeName", value)}
                placeholder="Northline Studio"
                error={fieldErrors.storeName}
              />
              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  Short bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={values.bio}
                  onChange={(event) => update("bio", event.target.value)}
                  placeholder="What you make, and who it is for."
                  className="w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <p className="text-xs text-muted-foreground">
                  {values.bio.trim().length}/280
                </p>
                {fieldErrors.bio ? (
                  <p className="text-sm text-destructive">{fieldErrors.bio}</p>
                ) : null}
              </div>
            </div>
          </div>
          <StorePreview
            name={values.displayName || user.name}
            storeName={values.storeName || "Your store"}
            bio={values.bio || "A short line about the work."}
            slug={values.slug || "your-store"}
            user={previewUser}
          />
          </div>
        </FadeInOnLoad>
      ) : null}

      {step === 2 ? (
        <FadeInOnLoad>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.85fr)] lg:gap-16">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
              Store
            </p>
            <h1 className="mt-3 font-display text-4xl tracking-tight">
              Pick a URL and a room.
            </h1>
            <div className="mt-8 space-y-4">
              <div className="space-y-2">
                <label htmlFor="slug" className="text-sm font-medium">
                  Store URL
                </label>
                <div className="flex overflow-hidden rounded-xl border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                  <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground">
                    lumen.app/creator/
                  </span>
                  <input
                    id="slug"
                    value={values.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      update("slug", slugifyStore(event.target.value));
                    }}
                    className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                  />
                </div>
                {fieldErrors.slug ? (
                  <p className="text-sm text-destructive">{fieldErrors.slug}</p>
                ) : slugQuery.isFetching ? (
                  <p className="text-xs text-muted-foreground">Checking…</p>
                ) : slugQuery.data ? (
                  <p
                    className={cn(
                      "text-xs",
                      slugQuery.data.available
                        ? "text-muted-foreground"
                        : "text-destructive",
                    )}
                  >
                    {slugQuery.data.available
                      ? "This URL is free."
                      : "This URL is taken."}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Store category
                </label>
                <select
                  id="category"
                  value={values.category}
                  onChange={(event) => update("category", event.target.value)}
                  className="h-12 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.category ? (
                  <p className="text-sm text-destructive">{fieldErrors.category}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Profile image</p>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-sm transition-colors",
                    avatarError
                      ? "border-destructive/40 hover:border-destructive/60"
                      : "border-border hover:border-foreground/30",
                    avatarUploading ? "pointer-events-none opacity-70" : null,
                  )}
                >
                  {avatarUploading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {avatarUploading
                    ? "Uploading photo…"
                    : publicHttpUrl(values.avatarUrl) || values.avatarUrl
                      ? "Replace image"
                      : "Upload a square photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={avatarUploading}
                    onChange={(event) => {
                      void onPickFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP, or GIF. The photo is stored on Cloudinary, then attached to your store.
                </p>
                {avatarError ? (
                  <p className="text-sm text-destructive">{avatarError}</p>
                ) : null}
              </div>
            </div>
          </div>
          <StorePreview
            name={values.displayName || user.name}
            storeName={values.storeName || "Your store"}
            bio={values.bio || "A short line about the work."}
            slug={values.slug || "your-store"}
            user={previewUser}
          />
          </div>
        </FadeInOnLoad>
      ) : null}

      {step === 3 ? (
        <FadeInOnLoad>
          <ReadyStep storeName={values.storeName || "your store"} />
        </FadeInOnLoad>
      ) : null}

      {error ? (
        <p className="mt-8 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {step < 3 ? (
        <div className="mt-10 flex flex-wrap gap-3">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="xl"
              className="rounded-xl"
              onClick={() => {
                setError(null);
                setFieldErrors({});
                setStep((current) => current - 1);
              }}
            >
              Back
            </Button>
          ) : null}
          <Button
            type="button"
            size="xl"
            className="rounded-xl"
            onClick={() => void onContinue()}
            disabled={busy || Boolean(slugTaken) || slugPending}
          >
            {busy ? <LoaderCircle className="animate-spin" /> : null}
            {step === 0 ? "Continue" : step === 2 ? "Open my store" : "Continue"}
            {busy ? null : <ArrowRight />}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Become a creator
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Sell on Lumen without renting a mall.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted-foreground">
        Open a store for kits, courses, and files. Keep the relationship with
        the people who buy from you. Ten percent. No monthly fee.
      </p>
      <ul className="mt-10 space-y-4">
        {[
          "A public store with your name on it",
          "Products that sit on Discover, not in a feed",
          "Sales and payouts from one workspace",
        ].map((item) => (
          <li key={item} className="flex gap-3 text-sm">
            <Check className="mt-0.5 size-4 text-brand" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReadyStep({
  storeName,
  already = false,
}: {
  storeName: string;
  already?: boolean;
}) {
  return (
    <div className="max-w-xl">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Ready
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        {already ? "Your store is already live." : "Your store is ready."}
      </h1>
      <p className="mt-5 text-lg text-muted-foreground">
        {already
          ? `${storeName} is open. Publish something when you are ready.`
          : `${storeName} is open. The next step is a product — a kit, a course, a file worth owning.`}
      </p>
      <Link
        href="/dashboard/products/new"
        className={cn(buttonVariants({ size: "xl" }), "mt-10 rounded-xl")}
      >
        Create your first product
        <ArrowRight />
      </Link>
    </div>
  );
}

function publicHttpUrl(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return undefined;
}

function issuesToFields(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Partial<Record<keyof BecomeCreatorValues, string>> {
  const next: Partial<Record<keyof BecomeCreatorValues, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && next[key as keyof BecomeCreatorValues] === undefined) {
      next[key as keyof BecomeCreatorValues] = issue.message;
    }
  }
  return next;
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-xl px-3"
        aria-invalid={Boolean(error)}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function StorePreview({
  name,
  storeName,
  bio,
  slug,
  user,
}: {
  name: string;
  storeName: string;
  bio: string;
  slug: string;
  user: AuthUser;
}) {
  return (
    <aside className="rounded-2xl border border-border bg-card p-6">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        Preview
      </p>
      <div className="mt-5 flex items-center gap-3">
        <UserAvatar user={user} size="md" />
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{storeName}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{bio}</p>
      <p className="mt-6 font-mono text-xs text-muted-foreground">
        lumen.app/creator/{slug}
      </p>
    </aside>
  );
}
