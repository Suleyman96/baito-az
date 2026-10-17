"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { MAX_JOB_IMAGES, type ImageErrorKey } from "@/lib/images";
import { parseSocialLinks } from "@/lib/social-links";
import { readUploadedImages } from "@/lib/storage";
import { parseWorkerProfile, type WorkerProfileErrorKey } from "@/lib/worker-profile";

export type WorkerProfileState = {
  errors: Partial<Record<string, WorkerProfileErrorKey | ImageErrorKey | "phoneTaken" | "locationInvalid" | "socialInvalid">>;
  values: Record<string, string | string[]>;
  saved?: boolean;
} | undefined;

const MULTI = ["additionalProfessions", "skills", "preferredDistricts", "workTypes"];

/** Saves the logged-in job seeker's own work profile (and the name and phone it shows/keeps on the account). */
export async function saveWorkerProfile(_prev: WorkerProfileState, formData: FormData): Promise<WorkerProfileState> {
  const lang = String(formData.get("lang") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/${hasLocale(lang) ? lang : defaultLocale}/login`);
  if (user.role !== "SEEKER") redirect(`/${hasLocale(lang) ? lang : defaultLocale}/account`);

  // Echoed back so the form keeps what was typed (files cannot be echoed; the picker keeps them)
  const values: Record<string, string | string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string" || key.startsWith("$") || key === "lang" || key === "removeImage") continue;
    if (MULTI.includes(key)) values[key] = [...((values[key] as string[]) ?? []), value];
    else values[key] = value;
  }

  const parsed = parseWorkerProfile(values);
  const social = parseSocialLinks(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])));
  if (!parsed.success || !social.success) {
    return { errors: { ...(parsed.success ? {} : parsed.errors), ...(social.success ? {} : social.errors) }, values };
  }
  const { name, phone, locationId, ...profile } = parsed.data;

  // The village must belong to the chosen district
  if (locationId) {
    const location = await db.location.findFirst({ where: { id: locationId, district: { slug: profile.district } } });
    if (!location) return { errors: { locationId: "locationInvalid" }, values };
  }

  // Portfolio images: only this profile's own images can be removed
  const existing = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, portfolio: { select: { id: true, position: true }, orderBy: { position: "asc" } } },
  });
  const requested = new Set(formData.getAll("removeImage").map(String));
  const remove = (existing?.portfolio ?? []).filter((i) => requested.has(i.id)).map((i) => i.id);
  const upload = await readUploadedImages(formData.getAll("images"));
  if ("error" in upload) return { errors: { images: upload.error }, values };
  if ((existing?.portfolio.length ?? 0) - remove.length + upload.images.length > MAX_JOB_IMAGES) {
    return { errors: { images: "imagesTooMany" }, values };
  }
  const next = (existing?.portfolio.at(-1)?.position ?? -1) + 1;
  const newImages = upload.images.map((image, i) => ({ ...image, position: next + i }));

  try {
    await db.user.update({ where: { id: user.id }, data: { name, phone, ...social.data } });
  } catch (e) {
    // Another account already uses this number
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { errors: { phone: "phoneTaken" }, values };
    throw e;
  }
  const data = { ...profile, locationId };
  await db.workerProfile.upsert({
    where: { userId: user.id },
    create: { ...data, userId: user.id, portfolio: { create: newImages } },
    update: { ...data, portfolio: { deleteMany: { id: { in: remove } }, create: newImages } },
  });
  refresh();
  return { errors: {}, values, saved: true };
}
