import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";
import { serviceUnavailable } from "../utils/app-error";
import { logEvent } from "../utils/logger";

export type CloudinaryUploadResult = {
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  version?: number;
  secureUrl: string;
  type: string;
};

function ensureConfigured() {
  const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw serviceUnavailable("Media storage is not configured.");
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary;
}

function folders() {
  return {
    productImages: (productId: string) => `marketplace/products/${productId}/images`,
    productFiles: (productId: string) => `marketplace/products/${productId}/files`,
    creatorAvatar: (creatorId: string) => `marketplace/creators/${creatorId}/avatar`,
    creatorBanner: (creatorId: string) => `marketplace/creators/${creatorId}/banner`,
  };
}

export const cloudinaryFolders = folders();

export async function uploadPublicImage(input: {
  buffer: Buffer;
  folder: string;
  fileName: string;
}): Promise<CloudinaryUploadResult> {
  const client = ensureConfigured();
  const result = await uploadBuffer(client, input.buffer, {
    folder: input.folder,
    resource_type: "image",
    type: "upload",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    filename_override: input.fileName.replace(/\.[^.]+$/, ""),
  });
  return mapResult(result);
}

export async function uploadPrivateFile(input: {
  buffer: Buffer;
  folder: string;
  fileName: string;
  mimeType: string;
}): Promise<CloudinaryUploadResult> {
  const client = ensureConfigured();
  const resourceType = resourceTypeFor(input.mimeType);
  const result = await uploadBuffer(client, input.buffer, {
    folder: input.folder,
    resource_type: resourceType,
    type: "authenticated",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    filename_override: input.fileName.replace(/\.[^.]+$/, ""),
  });
  return mapResult(result);
}

export function signedDeliveryUrl(input: {
  publicId: string;
  resourceType: string;
  format?: string;
  fileName?: string;
  expiresInSeconds?: number;
}) {
  const client = ensureConfigured();
  const ttl = input.expiresInSeconds ?? env.CLOUDINARY_DOWNLOAD_TTL_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + ttl;
  const url = client.url(input.publicId, {
    resource_type: input.resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
    flags: "attachment",
    attachment: input.fileName,
    format: input.format || undefined,
  });
  return { url, expiresAt: new Date(expiresAt * 1000).toISOString() };
}

export async function destroyCloudinaryAsset(input: {
  publicId: string;
  resourceType: string;
  type?: "upload" | "authenticated" | "private";
}) {
  const client = ensureConfigured();
  const result = (await client.uploader.destroy(input.publicId, {
    resource_type: input.resourceType,
    type: input.type ?? "upload",
    invalidate: true,
  })) as { result?: string };
  logEvent("cloudinary_asset_destroyed", {
    publicId: input.publicId,
    result: result.result ?? "ok",
  });
  return result;
}

function resourceTypeFor(mimeType: string): "image" | "video" | "raw" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) return "video";
  return "raw";
}

function mapResult(result: {
  public_id: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  version?: number;
  secure_url?: string;
  url?: string;
  type?: string;
}): CloudinaryUploadResult {
  return {
    publicId: result.public_id,
    resourceType: result.resource_type ?? "image",
    format: result.format ?? "",
    bytes: result.bytes ?? 0,
    width: result.width,
    height: result.height,
    version: result.version,
    secureUrl: result.secure_url ?? result.url ?? "",
    type: result.type ?? "upload",
  };
}

function uploadBuffer(
  client: typeof cloudinary,
  buffer: Buffer,
  options: Record<string, unknown>,
) {
  return new Promise<Parameters<typeof mapResult>[0]>((resolve, reject) => {
    const stream = client.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error("Upload failed"));
        return;
      }
      resolve(result);
    });
    stream.end(buffer);
  });
}
