"use client";

import { FileText, ImagePlus, LoaderCircle, Star, X } from "lucide-react";
import { useState, type DragEvent } from "react";
import { ApiError } from "@/lib/api/client";
import {
  deleteProductFile,
  deleteProductImage,
  reorderProductImages,
  uploadCreatorAvatar,
  uploadProductFile,
  uploadProductImage,
  type ManagedProductFile,
  type ManagedProductImage,
} from "@/lib/api/media";
import { cloudinaryThumb } from "@/lib/cloudinary";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";

type UploadState = "idle" | "uploading" | "processing" | "success" | "failed";

export function CoverUploader({
  value,
  onChange,
  productId,
  onNeedProduct,
}: {
  value: string;
  onChange: (url: string) => void;
  productId?: string;
  onNeedProduct?: () => Promise<string | undefined>;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setState("uploading");
    setProgress(20);
    try {
      let id = productId;
      if (!id && onNeedProduct) id = await onNeedProduct();
      if (!id) {
        throw new Error("Save the product details first, then add a cover.");
      }
      setProgress(55);
      setState("processing");
      const result = await uploadProductImage(id, file);
      onChange(result.image.url);
      setState("success");
    } catch (uploadError) {
      setState("failed");
      setError(uploadError instanceof ApiError ? uploadError.message : "Upload failed. Retry.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cloudinaryThumb(value, 1200)} alt="" className="h-48 w-full object-cover" />
        </div>
      ) : (
        <DropZone
          dragging={dragging}
          setDragging={setDragging}
          onFiles={handleFiles}
          label="Drop a cover image, or browse"
          hint="JPG, PNG, or WebP. Aim for 1600×1000."
          icon={ImagePlus}
          accept="image/jpeg,image/png,image/webp,image/gif"
        />
      )}
      {progress !== null ? <ProgressBar value={progress} /> : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {state === "uploading" || state === "processing" ? (
        <p className="mt-2 text-xs text-muted-foreground">Uploading cover…</p>
      ) : null}
    </div>
  );
}

export function AvatarUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setProgress(30);
    try {
      const result = await uploadCreatorAvatar(file);
      onChange(result.avatarUrl);
    } catch (uploadError) {
      setError(uploadError instanceof ApiError ? uploadError.message : "Could not update photo.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative size-28 overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cloudinaryThumb(value, 320)} alt="" className="size-full object-cover" />
        </div>
      ) : (
        <DropZone
          dragging={dragging}
          setDragging={setDragging}
          onFiles={handleFiles}
          label="Store photo"
          hint="Square JPG or PNG."
          icon={ImagePlus}
          compact
          accept="image/jpeg,image/png,image/webp"
        />
      )}
      {progress !== null ? <ProgressBar value={progress} /> : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function GalleryUploader({
  productId,
  images,
  onChange,
  onNeedProduct,
}: {
  productId?: string;
  images: ManagedProductImage[];
  onChange: (images: ManagedProductImage[]) => void;
  onNeedProduct?: () => Promise<string | undefined>;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function ensureId() {
    if (productId) return productId;
    return onNeedProduct?.();
  }

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const id = await ensureId();
    if (!id) {
      setError("Save product details before adding images.");
      return;
    }
    setProgress(15);
    const next = [...images];
    try {
      for (const file of Array.from(list)) {
        const result = await uploadProductImage(id, file);
        next.push(result.image);
        setProgress((value) => Math.min(95, (value ?? 20) + 20));
      }
      onChange(next);
    } catch (uploadError) {
      setError(uploadError instanceof ApiError ? uploadError.message : "Image upload failed.");
    } finally {
      setProgress(null);
    }
  }

  async function remove(imageId: string) {
    const id = await ensureId();
    if (!id) return;
    setBusyId(imageId);
    try {
      await deleteProductImage(id, imageId);
      onChange(images.filter((image) => image.id !== imageId));
    } catch (uploadError) {
      setError(uploadError instanceof ApiError ? uploadError.message : "Could not remove image.");
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const id = await ensureId();
    if (!id) return;
    const ordered = [...images];
    const [item] = ordered.splice(index, 1);
    if (!item) return;
    ordered.splice(target, 0, item);
    onChange(ordered);
    try {
      const result = await reorderProductImages(
        id,
        ordered.map((image) => image.id),
      );
      onChange(result.images);
    } catch (uploadError) {
      setError(uploadError instanceof ApiError ? uploadError.message : "Could not reorder.");
    }
  }

  return (
    <div className="space-y-3">
      {images.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cloudinaryThumb(image.url, 400)}
                alt=""
                className="h-24 w-full rounded-lg object-cover"
              />
              {index === 0 ? (
                <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                  Primary
                </span>
              ) : null}
              <div className="absolute top-1 right-1 flex gap-1">
                <button
                  type="button"
                  className="rounded-full bg-background/90 p-1"
                  aria-label="Move earlier"
                  onClick={() => void move(index, -1)}
                >
                  <Star className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded-full bg-background/90 p-1"
                  aria-label="Remove image"
                  disabled={busyId === image.id}
                  onClick={() => void remove(image.id)}
                >
                  {busyId === image.id ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <X className="size-3.5" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <DropZone
        dragging={dragging}
        setDragging={setDragging}
        onFiles={handleFiles}
        multiple
        label="Add preview images"
        hint="Up to 8 stills. First image is the cover."
        icon={ImagePlus}
        compact
        accept="image/jpeg,image/png,image/webp,image/gif"
      />
      {progress !== null ? <ProgressBar value={progress} /> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function FileUploader({
  productId,
  files,
  onChange,
  onNeedProduct,
}: {
  productId?: string;
  files: ManagedProductFile[];
  onChange: (files: ManagedProductFile[]) => void;
  onNeedProduct?: () => Promise<string | undefined>;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryFile, setRetryFile] = useState<File | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>("idle");

  async function uploadOne(file: File) {
    const id = productId ?? (await onNeedProduct?.());
    if (!id) {
      throw new Error("Save product details before uploading files.");
    }
    setState("uploading");
    setProgress(25);
    setState("processing");
    const result = await uploadProductFile(id, file);
    setState("success");
    onChange([...files, result.file]);
  }

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    setRetryFile(null);
    try {
      for (const file of Array.from(list)) {
        setProgress(20);
        await uploadOne(file);
      }
    } catch (uploadError) {
      setState("failed");
      setRetryFile(list[0] ?? null);
      setError(uploadError instanceof ApiError ? uploadError.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  }

  async function remove(fileId: string) {
    const id = productId ?? (await onNeedProduct?.());
    if (!id) return;
    setBusyId(fileId);
    try {
      await deleteProductFile(id, fileId);
      onChange(files.filter((file) => file.id !== fileId));
    } catch (uploadError) {
      setError(uploadError instanceof ApiError ? uploadError.message : "Could not remove file.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5"
        >
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{file.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.fileSize)}
              {file.format ? ` · ${file.format.toUpperCase()}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label={`Remove ${file.fileName}`}
            disabled={busyId === file.id}
            onClick={() => void remove(file.id)}
          >
            {busyId === file.id ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}
          </button>
        </div>
      ))}
      <DropZone
        dragging={dragging}
        setDragging={setDragging}
        onFiles={handleFiles}
        multiple
        label="Drop files here, or browse"
        hint="PDF, ZIP, EPUB, MP3, MP4, and office documents. Executables are blocked."
        icon={FileText}
        compact={files.length > 0}
        accept=".pdf,.zip,.epub,.docx,.xlsx,.pptx,.mp3,.mp4,.png,.jpg,.jpeg,.csv,.txt"
      />
      {progress !== null ? <ProgressBar value={progress} /> : null}
      {error ? (
        <div className="flex items-center justify-between gap-3 text-sm text-destructive">
          <p>{error}</p>
          {retryFile ? (
            <button
              type="button"
              className="font-medium underline"
              onClick={() => {
                const transfer = new DataTransfer();
                transfer.items.add(retryFile);
                void handleFiles(transfer.files);
              }}
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
      {state === "uploading" || state === "processing" ? (
        <p className="text-xs text-muted-foreground">Uploading to Cloudinary…</p>
      ) : null}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full bg-brand transition-[width] duration-150"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function DropZone({
  dragging,
  setDragging,
  onFiles,
  label,
  hint,
  icon: Icon,
  multiple,
  compact,
  accept,
}: {
  dragging: boolean;
  setDragging: (value: boolean) => void;
  onFiles: (files: FileList | null) => void;
  label: string;
  hint: string;
  icon: typeof ImagePlus;
  multiple?: boolean;
  compact?: boolean;
  accept?: string;
}) {
  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    onFiles(event.dataTransfer.files);
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center transition-colors",
        compact ? "py-6" : "py-10",
        dragging
          ? "border-brand bg-brand/5"
          : "border-border hover:border-foreground/30 hover:bg-muted/40",
      )}
    >
      <Icon className="size-5 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <input
        type="file"
        className="sr-only"
        multiple={multiple}
        accept={accept}
        onChange={(event) => onFiles(event.target.files)}
      />
    </label>
  );
}
