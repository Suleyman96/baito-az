"use server";

import bcrypt from "bcryptjs";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { companyNameKey } from "@/lib/company-name";
import { db } from "@/lib/db";
import type { ImageErrorKey } from "@/lib/images";
import { parseSocialLinks, SOCIAL_KINDS } from "@/lib/social-links";
import { readUploadedImages } from "@/lib/storage";
import { softDeleteUser } from "./delete-account";
import { deleteOtherSessions, deleteSession, getCurrentUser } from "./session";
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
  const values = text(formData, ["companyName", "description", "phone", "address", "latitude", "longitude", ...SOCIAL_KINDS]);
  const parsed = companySchema.safeParse(values);
  const social = parseSocialLinks(values);
  if (!parsed.success || !social.success) {
    return { errors: { ...(parsed.success ? {} : fieldErrors(parsed.error)), ...(social.success ? {} : social.errors) }, values };
  }

  // Another company already registered under this name (case and spaces ignored)
  const nameKey = parsed.data.companyName ? companyNameKey(parsed.data.companyName) : null;
  if (nameKey && (await db.company.findFirst({ where: { nameKey, ownerId: { not: user.id } }, select: { id: true } }))) {
    return { errors: { companyName: "companyNameTaken" }, values };
  }

  try {
    await db.company.updateMany({
      where: { ownerId: user.id },
      data: {
        // Private persons post under their own name
        name: parsed.data.companyName ?? user.name,
        nameKey,
        description: parsed.data.description ?? null,
        phone: parsed.data.phone ?? null,
        address: parsed.data.address ?? null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
      },
    });
  } catch (e) {
    // Unique constraint: another company took this name between the check above and this save
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { errors: { companyName: "companyNameTaken" }, values };
    throw e;
  }
  // Social links belong to the account, so the company page shows its owner's links
  await db.user.update({ where: { id: user.id }, data: social.data });
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
  // Someone who knew the old password is logged out everywhere else, and reset links sent before stop working
  await deleteOtherSessions(user.id);
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
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

/**
 * Deletes the logged-in user's own profile after they confirm and give their current password,
 * checked here against the stored hash. Then logs them out (see softDeleteUser for what is kept).
 */
export async function deleteAccount(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const lang = String(formData.get("lang") ?? "");
  const user = await requireUser(formData);
  // Admin accounts run the site; they are not removed from a profile page
  if (user.role === "ADMIN") return { errors: { form: "deleteNotAllowed" }, values: {} };
  if (formData.get("confirm") !== "on") return { errors: { confirm: "confirmRequired" }, values: {} };

  const password = String(formData.get("password") ?? "");
  const { passwordHash } = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
  if (!password || !(await bcrypt.compare(password, passwordHash))) {
    return { errors: { password: "currentPasswordWrong" }, values: {} };
  }

  await softDeleteUser(user.id);
  await deleteSession();
  redirect(`/${hasLocale(lang) ? lang : defaultLocale}/goodbye`);
}
