import { requestForm } from "@/lib/api/form";
import { requestJson } from "@/lib/api/http";

export type ManagedProductFile = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  format?: string;
  createdAt?: string;
};

export type ManagedProductImage = {
  id: string;
  url: string;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  sortOrder: number;
};

export function listProductFiles(productId: string) {
  return requestJson<{ files: ManagedProductFile[] }>(
    `/api/v1/products/${encodeURIComponent(productId)}/files`,
  );
}

export function listProductImages(productId: string) {
  return requestJson<{ images: ManagedProductImage[] }>(
    `/api/v1/products/${encodeURIComponent(productId)}/images`,
  );
}

export function uploadProductFile(productId: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return requestForm<{ file: ManagedProductFile }>(
    `/api/v1/products/${encodeURIComponent(productId)}/files`,
    body,
  );
}

export function deleteProductFile(productId: string, fileId: string) {
  return requestJson<{ ok: true }>(
    `/api/v1/products/${encodeURIComponent(productId)}/files/${encodeURIComponent(fileId)}`,
    { method: "DELETE" },
  );
}

export function uploadProductImage(productId: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return requestForm<{ image: ManagedProductImage }>(
    `/api/v1/products/${encodeURIComponent(productId)}/images`,
    body,
  );
}

export function deleteProductImage(productId: string, imageId: string) {
  return requestJson<{ ok: true }>(
    `/api/v1/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
    { method: "DELETE" },
  );
}

export function reorderProductImages(productId: string, imageIds: string[]) {
  return requestJson<{ images: ManagedProductImage[] }>(
    `/api/v1/products/${encodeURIComponent(productId)}/images/reorder`,
    { method: "PATCH", body: { imageIds } },
  );
}

export function uploadCreatorAvatar(file: File) {
  const body = new FormData();
  body.append("file", file);
  return requestForm<{ avatarUrl: string }>("/api/v1/creators/me/avatar", body);
}
