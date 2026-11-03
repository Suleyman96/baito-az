"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { defaultLocale, hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { db } from "@/lib/db";
import { mailer } from "@/lib/mailer";
import { appUrl } from "@/lib/notification-email";
import { getCurrentUser } from "./session";
import {
  ADMIN_LINK_HOURS,
  buildPasswordResetEmail,
  hashResetToken,
  isResetTokenShaped,
  MAX_RESET_EMAILS,
  newResetToken,
  RESET_LINK_MINUTES,
  resetLinkUsable,
} from "./password-reset";
import { resetPasswordSchema, resetRequestSchema } from "./validation";

export type ResetRequestState = { error?: "emailInvalid"; email: string; sent?: boolean } | undefined;
export type ResetPasswordState = { error?: "passwordShort" | "linkInvalid" } | undefined;
export type AdminResetLinkState = { link?: string; error?: "notAllowed" } | undefined;

const langOf = (formData: FormData): Locale => {
  const lang = String(formData.get("lang") ?? "");
  return hasLocale(lang) ? lang : defaultLocale;
};

/**
 * "Forgot password": emails a one-time link to the account with this email. The answer is the same
 * whether or not such an account exists, and all the work happens after the response, so neither the
 * text nor the response time tells which emails are registered.
 */
export async function requestPasswordReset(_prev: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const lang = langOf(formData);
  const email = String(formData.get("email") ?? "");
  const parsed = resetRequestSchema.safeParse({ email });
  if (!parsed.success) return { error: "emailInvalid", email };

  after(() => sendResetLink(parsed.data.email, lang));
  return { sent: true, email: parsed.data.email };
}

async function sendResetLink(email: string, lang: Locale) {
  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true, blockedAt: true, deletedAt: true } });
    // A blocked account could not log in with a new password either
    if (!user || user.blockedAt || user.deletedAt) return;

    const since = new Date(Date.now() - RESET_LINK_MINUTES * 60 * 1000);
    const recent = await db.passwordResetToken.count({ where: { userId: user.id, createdById: null, createdAt: { gte: since } } });
    if (recent >= MAX_RESET_EMAILS) return;

    const { token, hash } = newResetToken();
    await db.$transaction([
      // Expired links are of no use; removing them keeps the table small
      db.passwordResetToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      db.passwordResetToken.create({
        data: { id: hash, userId: user.id, email, expiresAt: new Date(Date.now() + RESET_LINK_MINUTES * 60 * 1000) },
      }),
    ]);

    if (!mailer.configured) {
      console.warn("Password reset asked for, but email sending is not configured (RESEND_API_KEY)");
      return;
    }
    const link = `${appUrl()}/${lang}/reset-password?token=${token}`;
    await mailer.send(buildPasswordResetEmail({ to: email, name: user.name, link, t: getDictionary(lang).passwordReset.email }));
  } catch (e) {
    console.error("Could not send a password reset email", e);
  }
}

/** Sets a new password through a reset link, then logs the account out everywhere. */
export async function resetPassword(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const lang = langOf(formData);
  const token = formData.get("token");
  if (!isResetTokenShaped(token)) return { error: "linkInvalid" };
  const parsed = resetPasswordSchema.safeParse({ password: String(formData.get("password") ?? "") });
  if (!parsed.success) return { error: "passwordShort" };

  const id = hashResetToken(token);
  const link = await db.passwordResetToken.findUnique({
    where: { id },
    select: { email: true, expiresAt: true, user: { select: { id: true, email: true, phone: true, blockedAt: true, deletedAt: true } } },
  });
  if (!link || !resetLinkUsable(link, link.user, new Date())) return { error: "linkInvalid" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const used = await db.$transaction(async (tx) => {
    // Taking the link first makes it single-use even if the form is sent twice at once
    const { count } = await tx.passwordResetToken.deleteMany({ where: { id } });
    if (count === 0) return false;
    const userId = link.user.id;
    await tx.user.update({ where: { id: userId }, data: { passwordHash } });
    // Other links of this account, every session (whoever knew the old password is logged out) and
    // the failed logins that may have locked the account
    await tx.passwordResetToken.deleteMany({ where: { userId } });
    await tx.session.deleteMany({ where: { userId } });
    const keys = [link.user.email, link.user.phone].filter((k): k is string => !!k);
    await tx.loginAttempt.deleteMany({ where: { key: { in: keys } } });
    return true;
  });
  if (!used) return { error: "linkInvalid" };

  redirect(`/${lang}/login?reset=1`);
}

/**
 * An admin makes a reset link for an account, for someone who cannot use the email reset (e.g. signed up
 * with a phone only). The admin hands it over after checking who asks. Shown once and never stored, only
 * its hash; a new one replaces the previous admin link of that account. Not for admin accounts, so one
 * admin cannot take over another.
 */
export async function createAdminResetLink(_prev: AdminResetLinkState, formData: FormData): Promise<AdminResetLinkState> {
  const admin = await getCurrentUser();
  if (admin?.role !== "ADMIN") return { error: "notAllowed" };
  const user = await db.user.findUnique({
    where: { id: String(formData.get("id") ?? "") },
    select: { id: true, role: true, blockedAt: true, deletedAt: true },
  });
  if (!user || user.role === "ADMIN" || user.blockedAt || user.deletedAt) return { error: "notAllowed" };

  const { token, hash } = newResetToken();
  await db.$transaction([
    db.passwordResetToken.deleteMany({ where: { OR: [{ userId: user.id, createdById: { not: null } }, { expiresAt: { lt: new Date() } }] } }),
    db.passwordResetToken.create({
      data: { id: hash, userId: user.id, createdById: admin.id, expiresAt: new Date(Date.now() + ADMIN_LINK_HOURS * 60 * 60 * 1000) },
    }),
  ]);
  return { link: `${appUrl()}/${langOf(formData)}/reset-password?token=${token}` };
}
