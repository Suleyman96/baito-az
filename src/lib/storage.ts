import "server-only";
import { db } from "@/lib/db";
import { checkImage, type ImageErrorKey, type ImageType } from "@/lib/images";
import { checkResume, type ResumeErrorKey } from "@/lib/resumes";

// Images are stored in PostgreSQL, so the app needs no extra storage service.
// Everything that touches stored bytes goes through this file, so moving to S3/R2 later changes only here.

export type CheckedImage = { data: Uint8Array<ArrayBuffer>; mimeType: ImageType; size: number };

/** Reads and validates uploaded files. Empty file inputs (nothing chosen) are skipped. */
export async function readUploadedImages(files: FormDataEntryValue[]): Promise<{ images: CheckedImage[] } | { error: ImageErrorKey }> {
  const images: CheckedImage[] = [];
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    const data = new Uint8Array(await file.arrayBuffer());
    const result = checkImage(data);
    if ("error" in result) return { error: result.error };
    images.push({ data, mimeType: result.type, size: data.byteLength });
  }
  return { images };
}

export function readImage(id: string) {
  return db.image.findUnique({ where: { id }, select: { data: true, mimeType: true } });
}

// ---- CVs (private files; served only through the authorization check in app/api/resumes/[id]) ----

/** Reads and validates an uploaded CV. */
export async function readUploadedResume(file: FormDataEntryValue | null): Promise<{ data: Uint8Array<ArrayBuffer>; mimeType: string; fileName: string; size: number } | { error: ResumeErrorKey | "noFile" }> {
  if (!(file instanceof File) || file.size === 0) return { error: "noFile" };
  const data = new Uint8Array(await file.arrayBuffer());
  const result = checkResume(data, file.name);
  if ("error" in result) return result;
  return { data, mimeType: result.type, fileName: result.fileName, size: data.byteLength };
}

/** A CV with what is needed to decide who may read it. */
export function readResume(id: string) {
  return db.resume.findUnique({
    where: { id },
    select: {
      data: true,
      mimeType: true,
      fileName: true,
      ownerId: true,
      applications: { select: { job: { select: { company: { select: { ownerId: true } } } } } },
    },
  });
}

/** Deletes a CV that is no longer anyone's current CV and was not sent with any application. */
export async function deleteResumeIfUnused(id: string) {
  await db.resume.deleteMany({ where: { id, currentOf: null, applications: { none: {} } } });
}
