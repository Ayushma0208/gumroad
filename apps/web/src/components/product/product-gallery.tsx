"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  title,
  images,
}: {
  title: string;
  images: string[];
}) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const current = images[active] ?? images[0];

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") {
        setActive((index) => (index + 1) % images.length);
      }
      if (event.key === "ArrowLeft") {
        setActive((index) => (index - 1 + images.length) % images.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (!current) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted"
        aria-label="View larger image"
      >
        <Image
          src={current}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </button>

      {images.length > 1 ? (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-20",
                index === active
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : "opacity-70 hover:opacity-100",
              )}
              aria-label={`Preview image ${index + 1}`}
              aria-current={index === active}
            >
              <Image src={url} alt="" fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-5"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close preview"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
          <div
            className="relative aspect-[4/5] w-full max-w-lg overflow-hidden rounded-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={current}
              alt={title}
              fill
              sizes="80vw"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
