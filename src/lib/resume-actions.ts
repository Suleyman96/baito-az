"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { ResumeErrorKey } from "@/lib/resumes";
import { deleteResumeIfUnused, readUploadedResume } from "@/lib/storage";

export type ResumeFormState = { error?: ResumeErrorKey | "noFile"; saved?: boolean } | undefined;

/** The logged-in job seeker; CVs belong to job seekers only. */
async function requireSeeker(formData: FormData) {
  const lang = String(formData.get("lang") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/${hasLocale(lang) ? lang : defaultLocale}/login`);
  if (user.role !== "SEEKER") redirect(`/${hasLocale(lang) ? lang : defaultLocale}/account`);
  return user;
}

/** Uploads or replaces the logged-in seeker's own CV. */
export async function uploadResume(_prev: ResumeFormState, formData: FormData): Promise<ResumeFormState> {
  const user = await requireSeeker(formData);
  const upload = await readUploadedResume(formData.get("resume"));
  if ("error" in upload) return { error: upload.error };

  const { resumeId: oldId } = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { resumeId: true } });
  // A new row each time: employers who already received the old CV keep seeing what was sent
  await db.user.update({ where: { id: user.id }, data: { resume: { create: { ...upload, ownerId: user.id } } } });
  if (oldId) await deleteResumeIfUnused(oldId);
  refresh();
  return { saved: true };
}

/** Removes the seeker's current CV. Copies already sent with applications stay with those applications. */
export async function removeResume(formData: FormData) {
  const user = await requireSeeker(formData);
  const { resumeId } = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { resumeId: true } });
  if (resumeId) {
    await db.user.update({ where: { id: user.id }, data: { resumeId: null } });
    await deleteResumeIfUnused(resumeId);
  }
  refresh();
}
