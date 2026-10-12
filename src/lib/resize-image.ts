// Browser-side shrinking before upload: phone photos are often 3–8 MB, more than needed and slow on mobile data.

/**
 * Scales an image down to fit `maxSide` and re-encodes it as WebP (JPEG where WebP encoding is missing).
 * If the browser cannot read the file (e.g. HEIC outside Safari), the original is returned and the server decides.
 */
export async function resizeImage(file: File, maxSide: number, quality = 0.85): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    const type = blob?.type === "image/webp" ? "image/webp" : "image/jpeg";
    const out = type === "image/webp" ? blob! : await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!out || out.size >= file.size) return file;
    return new File([out], file.name.replace(/\.[^.]+$/, "") + (type === "image/webp" ? ".webp" : ".jpg"), { type });
  } catch {
    return file;
  }
}
