"use server";

import bcrypt from "bcryptjs";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { db } from "@/lib/db";
import type { ImageErrorKey } from "@/lib/images";
import { readUploadedImages } from "@/lib/storage";
import { deleteOtherSessions, getCurrentUser } from "./session";
import { accountSchema, companySchema, fieldErrors, passwordChangeSchema, type AuthErrorKey } from "./validation";

export type AccountFormState = {
  errors: Partial<Record<string, AuthErrorKey>>;
  values: Record<string, string>;
  saved?: boolean;
} | undefined;

async function requireUser(formData: FormData) {
  const lang = String(formData.get("lang") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/${hasLocale(lang) ? lang : defaultLocale}/login`);
  return user;
}

const text = (formData: FormData, keys: string[]) => Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));

export async function updateAccount(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const user = await requireUser(formData);
  const values = text(formData, ["name", "email", "phone"]);
  const parsed = accountSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    await db.user.update({
      where: { id: user.id },
      // null clears a contact the user removed
      data: { name: parsed.data.name, email: parsed.data.email ?? null, phone: parsed.data.phone ?? null },
    });
  } catch (e) {
    // Unique constraint: another account already uses this email or phone
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { errors: JSON.stringify(e.meta ?? {}).includes("phone") ? { phone: "phoneTaken" } : { email: "emailTaken" }, values };
    }
    throw e;
  }
  refresh();
  return { errors: {}, values, saved: true };
}

export async function updateCompany(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const user = await requireUser(formData);
  const values = text(formData, ["companyName", "description", "phone", "address", "latitude", "longitude"]);
  const parsed = companySchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  await db.company.updateMany({
    where: { ownerId: user.id },
    data: {
      // Private persons post under their own name
      name: parsed.data.companyName ?? user.name,
      description: parsed.data.description ?? null,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
    },
  });
  refresh();
  return { errors: {}, values, saved: true };
}

export async function changePassword(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const user = await requireUser(formData);
  const parsed = passwordChangeSchema.safeParse(text(formData, ["currentPassword", "newPassword"]));
  // Passwords are never echoed back into the form
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: {} };

  const { passwordHash } = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
  if (!(await bcrypt.compare(parsed.data.currentPassword, passwordHash))) {
    return { errors: { currentPassword: "currentPasswordWrong" }, values: {} };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) } });
  // Someone who knew the old password is logged out everywhere else
  await deleteOtherSessions(user.id);
  return { errors: {}, values: {}, saved: true };
}

export type AvatarFormState = { error?: ImageErrorKey | "imageRequired"; saved?: boolean } | undefined;

/** Sets or replaces the logged-in user's own profile photo. */
export async function updateAvatar(_prev: AvatarFormState, formData: FormData): Promise<AvatarFormState> {
  const user = await requireUser(formData);
  const upload = await readUploadedImages(formData.getAll("avatar"));
  if ("error" in upload) return { error: upload.error };
  const [image] = upload.images;
  if (!image) return { error: "imageRequired" };

  const { avatarId: oldId } = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { avatarId: true } });
  await db.user.update({ where: { id: user.id }, data: { avatar: { create: image } } });
  // The replaced photo is not used anywhere else
  if (oldId) await db.image.deleteMany({ where: { id: oldId } });
  refresh();
  return { saved: true };
}

export async function removeAvatar(formData: FormData) {
  const user = await requireUser(formData);
  const { avatarId } = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { avatarId: true } });
  if (avatarId) {
    await db.user.update({ where: { id: user.id }, data: { avatarId: null } });
    await db.image.deleteMany({ where: { id: avatarId } });
  }
  refresh();
}
