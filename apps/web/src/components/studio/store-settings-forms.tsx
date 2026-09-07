"use client";

import { Check, Copy, LoaderCircle, X } from "lucide-react";
import type { UseFormRegister, UseFormReturn } from "react-hook-form";
import { Field } from "@/components/studio/field";
import { Textarea } from "@/components/studio/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCheckCreatorSlug } from "@/hooks/use-creator";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { creatorPath, creatorStoreHostPath, creatorStoreUrl } from "@/lib/paths";
import type { StudioSettingsValues } from "@/lib/studio/schema";
import { useToastStore } from "@/stores/toast-store";

export function StoreUrlCard({ slug }: { slug: string }) {
  const showToast = useToastStore((state) => state.show);
  const hostPath = creatorStoreHostPath(slug);
  const href = creatorPath(slug);

  async function copy() {
    try {
      await navigator.clipboard.writeText(creatorStoreUrl(slug));
      showToast({ title: "Store URL copied" });
    } catch {
      showToast({ title: "Couldn’t copy", description: "Copy the URL from the address bar." });
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm font-medium">Your store</p>
      <p className="mt-2 font-mono text-sm break-all text-muted-foreground">{hostPath}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
          <Copy />
          Copy URL
        </Button>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-[0.8rem] font-medium hover:bg-muted"
        >
          View store
        </a>
      </div>
    </section>
  );
}

export function StoreSlugInput({
  form,
  currentSlug,
}: {
  form: UseFormReturn<StudioSettingsValues>;
  currentSlug: string;
}) {
  const slug = form.watch("slug");
  const debounced = useDebouncedValue(slug, 400);
  const valid =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(debounced) &&
    debounced.length >= 3 &&
    debounced.length <= 32;
  const check = useCheckCreatorSlug(
    debounced,
    valid && debounced !== currentSlug,
  );
  const taken = check.data && !check.data.available && debounced !== currentSlug;
  const available =
    valid && debounced === currentSlug
      ? true
      : Boolean(check.data?.available && !check.isFetching);

  return (
    <Field
      id="slug"
      label="Store URL"
      error={form.formState.errors.slug?.message}
      hint={
        taken
          ? undefined
          : `yourapp.com${creatorPath(slug || "your-store")}`
      }
    >
      <div className="flex overflow-hidden rounded-xl border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground">
          /creator/
        </span>
        <input
          id="slug"
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          aria-invalid={Boolean(form.formState.errors.slug) || taken}
          aria-describedby={taken ? "slug-taken" : undefined}
          {...form.register("slug")}
        />
      </div>
      <p className="mt-2 text-sm" aria-live="polite">
        {check.isFetching ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            Checking…
          </span>
        ) : taken ? (
          <span id="slug-taken" className="inline-flex items-center gap-1 text-destructive">
            <X className="size-3.5" />
            This store URL is already taken
          </span>
        ) : available && valid ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Check className="size-3.5" />
            Available
          </span>
        ) : null}
      </p>
    </Field>
  );
}

export function StoreProfileForm({
  register,
  errors,
}: {
  register: UseFormRegister<StudioSettingsValues>;
  errors: UseFormReturn<StudioSettingsValues>["formState"]["errors"];
}) {
  return (
    <section>
      <h2 className="text-base font-medium">Store profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Name, URL, and how the store reads on the public page.
      </p>
      <div className="mt-5 space-y-5">
        <Field id="storeName" label="Store name" error={errors.storeName?.message}>
          <Input id="storeName" className="h-11 rounded-xl" {...register("storeName")} />
        </Field>
        <Field id="displayName" label="Display name" error={errors.displayName?.message}>
          <Input id="displayName" className="h-11 rounded-xl" {...register("displayName")} />
        </Field>
        <Field id="bio" label="Short bio" error={errors.bio?.message}>
          <Textarea id="bio" {...register("bio")} />
        </Field>
        <Field
          id="description"
          label="Description"
          hint="Shown in the About section. Leave blank to hide it."
          error={errors.description?.message}
        >
          <Textarea id="description" className="min-h-36" {...register("description")} />
        </Field>
        <Field id="website" label="Website" error={errors.website?.message}>
          <Input
            id="website"
            type="url"
            inputMode="url"
            placeholder="https://"
            className="h-11 rounded-xl"
            {...register("website")}
          />
        </Field>
      </div>
    </section>
  );
}

export function SocialLinksForm({
  register,
  errors,
}: {
  register: UseFormRegister<StudioSettingsValues>;
  errors: UseFormReturn<StudioSettingsValues>["formState"]["errors"];
}) {
  const fields = [
    ["instagram", "Instagram"],
    ["twitter", "X"],
    ["linkedin", "LinkedIn"],
    ["youtube", "YouTube"],
    ["github", "GitHub"],
  ] as const;

  return (
    <section>
      <h2 className="text-base font-medium">Social links</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Only URLs you add appear on the storefront.
      </p>
      <div className="mt-5 space-y-5">
        {fields.map(([name, label]) => (
          <Field key={name} id={name} label={label} error={errors[name]?.message}>
            <Input
              id={name}
              type="url"
              inputMode="url"
              placeholder="https://"
              className="h-11 rounded-xl"
              {...register(name)}
            />
          </Field>
        ))}
      </div>
    </section>
  );
}
