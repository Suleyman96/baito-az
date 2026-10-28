import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";

const COOKIE_NAME = "baito_session";
const SESSION_DAYS = 30;

// The cookie holds the raw token; the database only stores its hash,
// so a leaked database copy cannot be used to log in
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  store.delete(COOKIE_NAME);
}

export type CurrentUser = { id: string; name: string; role: "SEEKER" | "EMPLOYER" | "ADMIN"; avatarId: string | null };

/**
 * The logged-in user, or null. Reads the request cookie, so callers must render
 * inside <Suspense>. Cached per request, so several components can call it.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: { id: true, name: true, role: true, blockedAt: true, deletedAt: true, avatarId: true } } },
  });
  // Blocking also deletes sessions; the check covers a request already in flight
  if (!session || session.expiresAt < new Date() || session.user.blockedAt || session.user.deletedAt) return null;
  const { id, name, role, avatarId } = session.user;
  return { id, name, role, avatarId };
});

/** Logs the user out on every other device, keeping the current session (after a password change). */
export async function deleteOtherSessions(userId: string) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  await db.session.deleteMany({ where: { userId, id: token ? { not: hashToken(token) } : undefined } });
}
