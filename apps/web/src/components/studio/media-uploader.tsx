"use client";

import { FileText, ImagePlus, X } from "lucide-react";
import { useState, type DragEvent } from "react";
import { formatFileSize } from "@/lib/studio/copy";
import { cn } from "@/lib/utils";
import type { StudioFile } from "@/types/studio";

/**
 * Frontend-only upload. Replace `simulateUpload` with a signed S3 PUT
 * (`POST /uploads/sign` → PUT to S3 → persist key) when media APIs exist.
 */
async function simulateUpload(
  file: File,
  onProgress: (value: number) => void,
): Promise<string> {
  return new Promise((resolve) => {
    let progress = 0;
    const timer = window.setInterval(() => {
      progress = Math.min(100, progress + 14 + Math.random() * 22);
      onProgress(progress);
      if (progress >= 100) {
        window.clearInterval(timer);
        resolve(URL.createObjectURL(file));
      }
    }, 90);
  });
}

export function CoverUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setProgress(8);
    const url = await simulateUpload(file, setProgress);
    onChange(url);
    setProgress(null);
  }

  return (
    <div>
      {value ? (
        <div className="relative overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-48 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-3 right-3 rounded-full bg-background/90 p-1.5"
            aria-label="Remove cover"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <DropZone
          dragging={dragging}
          setDragging={setDragging}
          onFiles={handleFiles}
          label="Drop a cover image, or browse"
          hint="JPG or PNG. Aim for 1600×1000."
          icon={ImagePlus}
        />
      )}
      {progress !== null ? <ProgressBar value={progress} /> : null}
    </div>
  );
}

export function GalleryUploader({
  values,
  onChange,
}: {
  values: string[];
  onChange: (urls: string[]) => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setProgress(8);
    const next = [...values];
    for (const file of Array.from(files)) {
      const url = await simulateUpload(file, setProgress);
      next.push(url);
    }
    onChange(next);
    setProgress(null);
  }

  return (
    <div className="space-y-3">
      {values.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {values.map((url, index) => (
            <li key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-24 w-full rounded-lg object-cover" />
              <button
                type="button"
                className="absolute top-1 right-1 rounded-full bg-background/90 p-1"
                aria-label="Remove image"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
              >
                <X className="size-3.5" />
              </button>
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
        hint="Optional. Drag to add more."
        icon={ImagePlus}
        compact
      />
      {progress !== null ? <ProgressBar value={progress} /> : null}
    </div>
  );
}

export function FileUploader({
  files,
  onChange,
}: {
  files: StudioFile[];
  onChange: (files: StudioFile[]) => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setProgress(8);
    const next = [...files];
    for (const file of Array.from(list)) {
      await simulateUpload(file, setProgress);
      next.push({
        id: `file_${Math.random().toString(16).slice(2, 10)}`,
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
      });
    }
    onChange(next);
    setProgress(null);
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
            <p className="truncate text-sm">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.sizeBytes)}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label={`Remove ${file.name}`}
            onClick={() => onChange(files.filter((item) => item.id !== file.id))}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <DropZone
        dragging={dragging}
        setDragging={setDragging}
        onFiles={handleFiles}
        multiple
        label="Drop product files, or browse"
        hint="ZIP, PDF, Figma, audio — whatever buyers receive."
        icon={FileText}
        compact={files.length > 0}
      />
      {progress !== null ? <ProgressBar value={progress} /> : null}
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
}: {
  dragging: boolean;
  setDragging: (value: boolean) => void;
  onFiles: (files: FileList | null) => void;
  label: string;
  hint: string;
  icon: typeof ImagePlus;
  multiple?: boolean;
  compact?: boolean;
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
        onChange={(event) => onFiles(event.target.files)}
      />
    </label>
  );
}
