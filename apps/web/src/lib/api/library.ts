import { requestJson } from "@/lib/api/http";

export type LibraryFile = {
  id: string;
  fileName: string;
  fileSize: number;
  format: string;
  mimeType?: string;
};

export type LibraryProduct = {
  product: {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
    productType: string;
    creator: { storeName: string; slug: string };
  };
  purchasedAt: string;
  updatedAt?: string;
  orderId: string;
  files: LibraryFile[];
};

export function getLibrary(page = 1, limit = 24) {
  return requestJson<{
    items: LibraryProduct[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>(`/api/v1/library?page=${page}&limit=${limit}`);
}

export function getLibraryProduct(productId: string) {
  return requestJson<LibraryProduct>(
    `/api/v1/library/${encodeURIComponent(productId)}`,
  );
}

export function getLibraryFiles(productId: string) {
  return requestJson<{ files: LibraryFile[] }>(
    `/api/v1/library/${encodeURIComponent(productId)}/files`,
  );
}

export function requestDownload(productId: string, fileId: string) {
  return requestJson<{ url: string; expiresAt: string; fileName: string }>(
    `/api/v1/library/products/${encodeURIComponent(productId)}/download?fileId=${encodeURIComponent(fileId)}`,
  );
}
