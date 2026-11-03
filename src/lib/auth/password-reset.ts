// Password reset by email: the parts without a database, so they are unit-tested.
// The actions are in password-reset-actions.ts.
import { createHash, randomBytes } from "node:crypto";
import type { Email } from "@/lib/notification-email";

/** How long an emailed reset link works */
export const RESET_LINK_MINUTES = 60;
/** How long a link made by an admin works: it is handed over in person or by phone, which takes longer */
export const ADMIN_LINK_HOURS = 24;
/** Reset emails per account within RESET_LINK_MINUTES, so nobody can flood someone's inbox */
export const MAX_RESET_EMAILS = 3;

/** A new link token and the hash stored for it (PasswordResetToken.id); the token itself is never stored */
export function newResetToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashResetToken(token) };
}

export const hashResetToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** A token as it can appear in a link: anything else is refused without a database lookup */
export const isResetTokenShaped = (token: unknown): token is string => typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);

/** Can this link still be used by this account? An emailed link only while the account keeps that email */
export function resetLinkUsable(
  link: { email: string | null; expiresAt: Date },
  user: { email: string | null; blockedAt: Date | null; deletedAt: Date | null },
  now: Date,
) {
  return link.expiresAt > now && (link.email === null || user.email === link.email) && !user.blockedAt && !user.deletedAt;
}

/** The email with the link, in the language the reset was asked for. Texts are dictionary.passwordReset.email */
export function buildPasswordResetEmail(input: { to: string; name: string; link: string; t: { subject: string; text: string } }): Email {
  const fill = (s: string) =>
    s.replaceAll("{name}", input.name).replaceAll("{link}", input.link).replaceAll("{minutes}", String(RESET_LINK_MINUTES));
  return { to: input.to, subject: fill(input.t.subject), text: fill(input.t.text) };
}
