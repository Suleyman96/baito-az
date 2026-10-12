// Upload rules shared by the browser (early feedback) and the server (the real check)

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_JOB_IMAGES = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export type ImageErrorKey = "imageType" | "imageTooLarge" | "imagesTooMany";

/**
 * The real type of an image from its first bytes ("magic numbers"). The file name and the
 * browser-sent type can be faked, so they are never trusted. SVG is not accepted: it can carry scripts.
 */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // RIFF....WEBP
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

/** Checks one uploaded file; returns its type, or the reason it is refused. */
export function checkImage(bytes: Uint8Array): { type: ImageType } | { error: ImageErrorKey } {
  if (bytes.byteLength > MAX_IMAGE_BYTES) return { error: "imageTooLarge" };
  const type = sniffImageType(bytes);
  return type ? { type } : { error: "imageType" };
}

/** Where an image is served from (see app/api/images/[id]). */
export const imageUrl = (id: string) => `/api/images/${id}`;
