"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileArchive,
  GraduationCap,
  Layers,
  LayoutTemplate,
  LoaderCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { Field, fieldControlClass } from "@/components/studio/field";
import {
  CoverUploader,
  FileUploader,
  GalleryUploader,
} from "@/components/studio/media-uploader";
import { ProductStatusBadge } from "@/components/studio/status-badge";
import { StudioPage } from "@/components/studio/studio-page";
import { Textarea } from "@/components/studio/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCatalogCategories } from "@/hooks/use-catalog";
import {
  useProductStatusMutation,
  useSaveProductMutation,
} from "@/hooks/use-studio";
import { categories as mockCategories } from "@/lib/mock/catalog";
import {
  listProductFiles,
  listProductImages,
  type ManagedProductFile,
  type ManagedProductImage,
} from "@/lib/api/media";
import { formatPrice } from "@/lib/format";
import { pricingCopy, productKindCopy } from "@/lib/studio/copy";
import {
  emptyProductDraft,
  productDraftSchema,
  type ProductDraftValues,
} from "@/lib/studio/schema";
import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import type { StudioProduct, StudioProductKind } from "@/types/studio";

const steps = [
  { id: "type", label: "Type" },
  { id: "details", label: "Details" },
  { id: "images", label: "Images" },
  { id: "files", label: "Files" },
  { id: "pricing", label: "Pricing" },
  { id: "review", label: "Review" },
  { id: "publish", label: "Publish" },
] as const;

const stepFields: Record<number, FieldPath<ProductDraftValues>[]> = {
  0: ["kind"],
  1: ["title", "shortDescription", "description", "categorySlug"],
  2: ["coverUrl"],
  3: ["files"],
  4: ["pricingModel", "priceCents", "currency", "minPriceCents", "suggestedPriceCents"],
};

const kinds: {
  id: StudioProductKind;
  icon: typeof FileArchive;
}[] = [
  { id: "download", icon: FileArchive },
  { id: "course", icon: GraduationCap },
  { id: "template", icon: LayoutTemplate },
  { id: "bundle", icon: Layers },
];

export function productToDraft(product: StudioProduct): ProductDraftValues {
  return {
    kind: product.kind,
    title: product.title,
    shortDescription: product.shortDescription,
    description: product.description,
    categorySlug: product.categorySlug,
    coverUrl: product.coverUrl,
    gallery: product.gallery,
    files: product.files,
    pricingModel: product.pricingModel,
    currency: product.currency,
    priceCents: product.priceCents,
    suggestedPriceCents: product.suggestedPriceCents ?? product.priceCents,
    minPriceCents: product.minPriceCents ?? 0,
  };
}

export function ProductEditor({
  mode,
  product,
}: {
  mode: "create" | "edit";
  product?: StudioProduct;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const save = useSaveProductMutation(userId);
  const statusMut = useProductStatusMutation(userId);
  const categoriesQuery = useCatalogCategories();
  const categoryOptions = categoriesQuery.data ?? mockCategories;
  const showToast = useToastStore((state) => state.show);
  const [step, setStep] = useState(0);
  const [productId, setProductId] = useState(product?.id);
  const [galleryImages, setGalleryImages] = useState<ManagedProductImage[]>([]);
  const [managedFiles, setManagedFiles] = useState<ManagedProductFile[]>(
    (product?.files ?? []).map((file) => ({
      id: file.id,
      fileName: file.name,
      fileSize: file.sizeBytes,
      mimeType: file.mimeType,
    })),
  );

  const form = useForm<ProductDraftValues>({
    resolver: zodResolver(productDraftSchema),
    mode: "onTouched",
    defaultValues: product ? productToDraft(product) : emptyProductDraft,
  });

  const dirty = form.formState.isDirty;

  useEffect(() => {
    if (!productId) return;
    void Promise.all([
      listProductImages(productId),
      listProductFiles(productId),
    ]).then(([imagePayload, filePayload]) => {
      setGalleryImages(imagePayload.images);
      setManagedFiles(filePayload.files);
      form.setValue(
        "files",
        filePayload.files.map((file) => ({
          id: file.id,
          name: file.fileName,
          sizeBytes: file.fileSize,
          mimeType: file.mimeType,
        })),
        { shouldValidate: true },
      );
      const cover = imagePayload.images[0]?.url;
      if (cover) form.setValue("coverUrl", cover);
    }).catch(() => undefined);
  }, [productId, form]);

  async function persist(
    status: "draft" | "published",
    options: { navigate?: boolean } = { navigate: true },
  ) {
    if (status === "published") {
      const valid = await form.trigger();
      if (!valid) {
        setStep(1);
        return;
      }
      if (managedFiles.length === 0 || !(form.getValues("coverUrl") || galleryImages[0]?.url)) {
        showToast({
          title: "Cannot publish product",
          description: "Add a cover image and at least one downloadable file.",
        });
        setStep(managedFiles.length === 0 ? 3 : 2);
        return;
      }
    } else {
      const valid = await form.trigger([
        "kind",
        "title",
        "shortDescription",
        "description",
        "categorySlug",
      ]);
      if (!valid) {
        setStep(1);
        return;
      }
    }
    const draft = {
      ...form.getValues(),
      files: managedFiles.map((file) => ({
        id: file.id,
        name: file.fileName,
        sizeBytes: file.fileSize,
        mimeType: file.mimeType,
      })),
      gallery: galleryImages.map((image) => image.url),
      coverUrl: form.getValues("coverUrl") || galleryImages[0]?.url || "",
    };
    const next = await save.mutateAsync({
      draft,
      status,
      productId,
    });
    setProductId(next.id);
    form.reset(productToDraft(next));
    showToast({
      title: status === "published" ? "Published" : "Draft saved",
      description: next.title,
    });
    if (options.navigate) {
      router.push("/dashboard/products");
      router.refresh();
    }
    return next;
  }

  async function ensureDraft() {
    if (productId) return productId;
    const valid = await form.trigger(["title", "shortDescription", "description", "categorySlug"]);
    if (!valid) {
      setStep(1);
      return undefined;
    }
    const next = await persist("draft", { navigate: false });
    return next?.id;
  }

  async function nextStep() {
    const fields = stepFields[step];
    const valid = fields ? await form.trigger(fields) : true;
    if (!valid) return;
    if (step === 1) {
      await ensureDraft();
    }
    setStep((current) => Math.min(steps.length - 1, current + 1));
  }

  return (
    <StudioPage className="max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
            {mode === "edit" ? "Edit product" : "New product"}
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            {mode === "edit" ? product?.title : "Create a product"}
          </h1>
          {mode === "edit" && product ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <ProductStatusBadge status={product.status} />
              {dirty ? (
                <span>Unsaved changes</span>
              ) : (
                <span>All changes saved</span>
              )}
            </div>
          ) : null}
        </div>
        <Link
          href="/dashboard/products"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Back to products
        </Link>
      </div>

      <ol className="mt-8 flex gap-1 overflow-x-auto">
        {steps.map((item, index) => (
          <li key={item.id} className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setStep(index)}
              className="w-full text-left"
            >
              <span
                className={cn(
                  "block h-1 rounded-full",
                  index <= step ? "bg-foreground" : "bg-muted",
                )}
              />
              <span className="mt-2 hidden text-xs text-muted-foreground sm:block">
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-sm text-muted-foreground sm:hidden">
        Step {step + 1} of {steps.length} — {steps[step]?.label}
      </p>

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          void persist("published");
        }}
        noValidate
      >
        {step === 0 ? <TypeStep form={form} /> : null}
        {step === 1 ? (
          <DetailsStep form={form} categories={categoryOptions} />
        ) : null}
        {step === 2 ? (
          <ImagesStep
            form={form}
            productId={productId}
            images={galleryImages}
            onImagesChange={setGalleryImages}
            onNeedProduct={ensureDraft}
          />
        ) : null}
        {step === 3 ? (
          <FilesStep
            form={form}
            productId={productId}
            files={managedFiles}
            onFilesChange={(next) => {
              setManagedFiles(next);
              form.setValue(
                "files",
                next.map((file) => ({
                  id: file.id,
                  name: file.fileName,
                  sizeBytes: file.fileSize,
                  mimeType: file.mimeType,
                })),
                { shouldDirty: true, shouldValidate: true },
              );
            }}
            onNeedProduct={ensureDraft}
          />
        ) : null}
        {step === 4 ? <PricingStep form={form} /> : null}
        {step === 5 ? (
          <ReviewStep values={form.getValues()} categories={categoryOptions} />
        ) : null}
        {step === 6 ? (
          <PublishStep fileCount={managedFiles.length} cover={form.watch("coverUrl")} />
        ) : null}

        <div className="mt-10 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            Back
          </Button>
          <div className="flex flex-wrap gap-2">
            {step < 6 ? (
              <Button type="button" size="lg" className="rounded-xl" onClick={() => void nextStep()}>
                Continue
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  disabled={save.isPending}
                  onClick={() => void persist("draft")}
                >
                  {save.isPending ? <LoaderCircle className="animate-spin" /> : null}
                  Save as draft
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-xl"
                  disabled={save.isPending}
                >
                  {save.isPending ? <LoaderCircle className="animate-spin" /> : null}
                  {mode === "edit" && product?.status === "published"
                    ? "Save & keep live"
                    : "Publish product"}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>

      {mode === "edit" && product ? (
        <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
          {product.status === "published" ? (
            <Button
              variant="outline"
              disabled={statusMut.isPending}
              onClick={() =>
                void statusMut.mutateAsync({
                  productId: product.id,
                  status: "draft",
                }).then(() => showToast({ title: "Unpublished" }))
              }
            >
              Unpublish
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={statusMut.isPending}
              onClick={() => void persist("published")}
            >
              Publish
            </Button>
          )}
          <Button
            type="button"
            disabled={save.isPending || !dirty}
            onClick={() =>
              void persist(product.status === "published" ? "published" : "draft", {
                navigate: false,
              })
            }
          >
            Save changes
          </Button>
        </div>
      ) : null}
    </StudioPage>
  );
}

function TypeStep({
  form,
}: {
  form: ReturnType<typeof useForm<ProductDraftValues>>;
}) {
  const selected = form.watch("kind");
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {kinds.map((kind) => {
        const Icon = kind.icon;
        const copy = productKindCopy[kind.id];
        const active = selected === kind.id;
        return (
          <button
            key={kind.id}
            type="button"
            onClick={() => form.setValue("kind", kind.id, { shouldDirty: true })}
            className={cn(
              "rounded-2xl border p-5 text-left transition-colors",
              active
                ? "border-foreground bg-muted/50"
                : "border-border hover:border-foreground/30 hover:bg-muted/30",
            )}
          >
            <Icon className="size-5" />
            <p className="mt-4 font-medium">{copy.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {copy.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function DetailsStep({
  form,
  categories,
}: {
  form: ReturnType<typeof useForm<ProductDraftValues>>;
  categories: { slug: string; label: string }[];
}) {
  const errors = form.formState.errors;
  return (
    <div className="space-y-5">
      <Field id="title" label="Product title" error={errors.title?.message}>
        <Input
          id="title"
          className="h-11 rounded-xl"
          placeholder="Northline UI System"
          aria-invalid={Boolean(errors.title)}
          {...form.register("title")}
        />
      </Field>
      <Field
        id="shortDescription"
        label="Short description"
        hint="Shown on cards and search results."
        error={errors.shortDescription?.message}
      >
        <Input
          id="shortDescription"
          className="h-11 rounded-xl"
          placeholder="A complete Figma kit for modern SaaS products."
          aria-invalid={Boolean(errors.shortDescription)}
          {...form.register("shortDescription")}
        />
      </Field>
      <Field
        id="description"
        label="Full description"
        hint="What they get, who it’s for, and why it exists."
        error={errors.description?.message}
      >
        <Textarea
          id="description"
          aria-invalid={Boolean(errors.description)}
          {...form.register("description")}
        />
      </Field>
      <Field id="categorySlug" label="Category" error={errors.categorySlug?.message}>
        <select
          id="categorySlug"
          className={fieldControlClass(Boolean(errors.categorySlug))}
          {...form.register("categorySlug")}
        >
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function ImagesStep({
  form,
  productId,
  images,
  onImagesChange,
  onNeedProduct,
}: {
  form: ReturnType<typeof useForm<ProductDraftValues>>;
  productId?: string;
  images: ManagedProductImage[];
  onImagesChange: (images: ManagedProductImage[]) => void;
  onNeedProduct: () => Promise<string | undefined>;
}) {
  const cover = form.watch("coverUrl");
  const errors = form.formState.errors;

  return (
    <div className="space-y-8">
      <Field label="Cover image" error={errors.coverUrl?.message}>
        <CoverUploader
          value={cover}
          productId={productId}
          onNeedProduct={onNeedProduct}
          onChange={(url) => form.setValue("coverUrl", url, { shouldDirty: true, shouldValidate: true })}
        />
      </Field>
      <Field label="Gallery" hint="Reorder so the first still is primary.">
        <GalleryUploader
          productId={productId}
          images={images}
          onChange={onImagesChange}
          onNeedProduct={onNeedProduct}
        />
      </Field>
    </div>
  );
}

function FilesStep({
  form,
  productId,
  files,
  onFilesChange,
  onNeedProduct,
}: {
  form: ReturnType<typeof useForm<ProductDraftValues>>;
  productId?: string;
  files: ManagedProductFile[];
  onFilesChange: (files: ManagedProductFile[]) => void;
  onNeedProduct: () => Promise<string | undefined>;
}) {
  const errors = form.formState.errors;
  return (
    <Field
      label="Digital files"
      hint="Buyers receive these after a verified payment. Links expire."
      error={errors.files?.message}
    >
      <FileUploader
        productId={productId}
        files={files}
        onChange={onFilesChange}
        onNeedProduct={onNeedProduct}
      />
    </Field>
  );
}

function PublishStep({ fileCount, cover }: { fileCount: number; cover: string }) {
  const ready = fileCount > 0 && Boolean(cover);
  return (
    <div className="rounded-2xl border border-border p-6">
      <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
        Publish
      </p>
      <h2 className="mt-3 font-display text-3xl tracking-tight">
        {ready ? "Ready for the marketplace" : "Cannot publish product"}
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        {ready
          ? "A cover, description, price, and at least one file are in place."
          : "Add at least one downloadable file and a cover image before this listing can go live."}
      </p>
    </div>
  );
}

function PricingStep({
  form,
}: {
  form: ReturnType<typeof useForm<ProductDraftValues>>;
}) {
  const model = form.watch("pricingModel");
  const errors = form.formState.errors;

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {(["free", "fixed", "pwyw"] as const).map((id) => {
          const copy = pricingCopy[id];
          const active = model === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() =>
                form.setValue("pricingModel", id, { shouldDirty: true, shouldValidate: true })
              }
              className={cn(
                "rounded-2xl border px-5 py-4 text-left transition-colors",
                active
                  ? "border-foreground bg-muted/50"
                  : "border-border hover:border-foreground/30",
              )}
            >
              <p className="font-medium">{copy.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
            </button>
          );
        })}
      </div>

      {model === "fixed" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="currency" label="Currency">
            <select
              id="currency"
              className={fieldControlClass()}
              {...form.register("currency")}
            >
              <option value="USD">USD</option>
              <option value="INR">INR</option>
            </select>
          </Field>
          <Field
            id="price"
            label="Price"
            error={errors.priceCents?.message}
          >
            <Input
              id="price"
              type="number"
              min={1}
              step="0.01"
              className="h-11 rounded-xl"
              value={(form.watch("priceCents") / 100).toString()}
              onChange={(event) =>
                form.setValue(
                  "priceCents",
                  Math.round(Number(event.target.value || 0) * 100),
                  { shouldDirty: true, shouldValidate: true },
                )
              }
            />
          </Field>
        </div>
      ) : null}

      {model === "pwyw" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="min" label="Minimum">
            <Input
              id="min"
              type="number"
              min={0}
              step="0.01"
              className="h-11 rounded-xl"
              value={(form.watch("minPriceCents") / 100).toString()}
              onChange={(event) =>
                form.setValue(
                  "minPriceCents",
                  Math.round(Number(event.target.value || 0) * 100),
                  { shouldDirty: true },
                )
              }
            />
          </Field>
          <Field
            id="suggested"
            label="Suggested"
            error={errors.suggestedPriceCents?.message}
          >
            <Input
              id="suggested"
              type="number"
              min={0}
              step="0.01"
              className="h-11 rounded-xl"
              value={(form.watch("suggestedPriceCents") / 100).toString()}
              onChange={(event) =>
                form.setValue(
                  "suggestedPriceCents",
                  Math.round(Number(event.target.value || 0) * 100),
                  { shouldDirty: true, shouldValidate: true },
                )
              }
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}

function ReviewStep({
  values,
  categories,
}: {
  values: ProductDraftValues;
  categories: { slug: string; label: string }[];
}) {
  const category = categories.find((item) => item.slug === values.categorySlug);
  const priceLabel = useMemo(() => {
    if (values.pricingModel === "free") return "Free";
    if (values.pricingModel === "pwyw") {
      return `Pay what you want · suggested ${formatPrice(values.suggestedPriceCents, values.currency)}`;
    }
    return formatPrice(values.priceCents, values.currency);
  }, [values]);

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
      {values.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={values.coverUrl} alt="" className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-36 items-center justify-center bg-muted text-sm text-muted-foreground">
          No cover yet
        </div>
      )}
      <div className="space-y-4 p-5">
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
          {productKindCopy[values.kind].label} · {category?.label}
        </p>
        <h2 className="font-display text-3xl tracking-tight">
          {values.title || "Untitled"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {values.shortDescription || "No pitch yet."}
        </p>
        <p className="text-sm leading-relaxed">{values.description}</p>
        <p className="text-base font-medium">{priceLabel}</p>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Included files
          </p>
          {values.files.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">None attached.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {values.files.map((file) => (
                <li key={file.id}>{file.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
