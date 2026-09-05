"use client";

import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { catalogProductTypeLabel } from "@/lib/api/checkout";
import { cloudinaryThumb } from "@/lib/cloudinary";
import { formatDate, formatFileSize } from "@/lib/format";
import { productPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { useLibraryProduct, useRequestDownload } from "@/hooks/use-library";

export default function LibraryProductPage() {
  const params = useParams<{ productId: string }>();
  const query = useLibraryProduct(params.productId);
  const download = useRequestDownload(params.productId);
  const [message, setMessage] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  async function onDownload(fileId: string) {
    setMessage(null);
    setActiveFile(fileId);
    try {
      const result = await download.mutateAsync(fileId);
      window.location.assign(result.url);
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : "We couldn’t start this download. Try again.",
      );
    } finally {
      setActiveFile(null);
    }
  }

  if (query.isPending) {
    return (
      <Container className="flex min-h-[50vh] items-center justify-center py-16">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </Container>
    );
  }

  if (query.error instanceof ApiError && (query.error.status === 403 || query.error.status === 404)) {
    return (
      <Container className="py-16 text-center">
        <h1 className="font-display text-3xl">This isn’t in your library</h1>
        <p className="mt-3 text-muted-foreground">
          Only products you’ve purchased can be opened here.
        </p>
        <Link href="/library" className={cn(buttonVariants({ size: "lg" }), "mt-8 rounded-xl")}>
          Back to library
        </Link>
      </Container>
    );
  }

  const item = query.data;
  if (!item) {
    return (
      <Container className="py-16 text-center">
        <h1 className="font-display text-3xl">Not found</h1>
        <Link href="/library" className={cn(buttonVariants({ size: "lg" }), "mt-8 rounded-xl")}>
          Back to library
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow={item.product.creator.storeName}
        title={item.product.title}
        description={`${catalogProductTypeLabel(item.product.productType)} · Purchased ${formatDate(item.purchasedAt)}`}
      />
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
            {item.product.coverImage ? (
              <Image
                src={cloudinaryThumb(item.product.coverImage, 1400)}
                alt=""
                fill
                className="object-cover"
              />
            ) : null}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Order #{item.orderId.slice(-8).toUpperCase()}. Each download is checked on the
            server and expires shortly after it’s issued.
          </p>
          {message ? <p className="mt-4 text-sm text-destructive">{message}</p> : null}
          <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
            {item.files.length === 0 ? (
              <li className="p-5 text-sm text-muted-foreground">
                Files for this product are no longer attached. Contact the creator if you expected a download.
              </li>
            ) : (
              item.files.map((file) => (
                <li key={file.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{file.fileName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {file.format ? file.format.toUpperCase() : "File"} · {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                  <Button
                    className="rounded-xl"
                    disabled={activeFile === file.id}
                    onClick={() => void onDownload(file.id)}
                  >
                    {activeFile === file.id ? (
                      <>
                        <LoaderCircle className="animate-spin" />
                        Checking access…
                      </>
                    ) : (
                      "Download"
                    )}
                  </Button>
                </li>
              ))
            )}
          </ul>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Product page</p>
          <Link
            href={productPath(item.product.slug)}
            className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-full rounded-xl")}
          >
            View listing
          </Link>
          <Link
            href={`/orders/${item.orderId}`}
            className={cn(buttonVariants({ variant: "ghost" }), "mt-2 w-full rounded-xl")}
          >
            View order
          </Link>
        </aside>
      </div>
    </Container>
  );
}
