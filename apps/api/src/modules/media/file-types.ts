import { badRequest } from "../../utils/app-error";

export const MAX_PRODUCT_IMAGES = 8;

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export const PRODUCT_FILE_ALLOWLIST: Record<string, string[]> = {
  pdf: ["application/pdf"],
  zip: ["application/zip", "application/x-zip-compressed"],
  epub: ["application/epub+zip"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  mp3: ["audio/mpeg", "audio/mp3"],
  mp4: ["video/mp4"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  csv: ["text/csv", "application/csv"],
  txt: ["text/plain"],
};

const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "sh",
  "dll",
  "com",
  "msi",
  "js",
  "php",
]);

export function extensionOf(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? (parts.at(-1) ?? "") : "";
}

export function assertAllowedProductFile(fileName: string, mimeType: string) {
  const extension = extensionOf(fileName);
  if (!extension || BLOCKED_EXTENSIONS.has(extension)) {
    throw badRequest("This file type is not allowed.");
  }
  const allowedMimes = PRODUCT_FILE_ALLOWLIST[extension];
  if (!allowedMimes) {
    throw badRequest("This file type is not allowed.");
  }
  if (mimeType && !allowedMimes.includes(mimeType) && mimeType !== "application/octet-stream") {
    throw badRequest("File type does not match its contents.");
  }
  return { extension, mimeType: mimeType || allowedMimes[0]! };
}

export function assertAllowedImage(fileName: string, mimeType: string) {
  const extension = extensionOf(fileName);
  if (!IMAGE_EXTENSIONS.has(extension) || (mimeType && !IMAGE_MIME_TYPES.has(mimeType))) {
    throw badRequest("Use a JPG, PNG, WebP, or GIF image.");
  }
  return { extension, mimeType: mimeType || "image/jpeg" };
}

export function productFileAccept() {
  return Object.keys(PRODUCT_FILE_ALLOWLIST)
    .map((ext) => `.${ext}`)
    .join(",");
}
