import "server-only";
import { db } from "@/lib/db";

// Slows down password guessing: after too many failed logins for one email or phone, further
// attempts for it are refused until the window passes. Stored in the database, so it holds
// across server restarts and several server instances.

/** Failed logins allowed per email or phone within the window */
export const MAX_FAILED_LOGINS = 10;
const WINDOW_MS = 15 * 60 * 1000;

const windowStart = () => new Date(Date.now() - WINDOW_MS);

export async function isLoginThrottled(key: string) {
  const recent = await db.loginAttempt.count({ where: { key, createdAt: { gte: windowStart() } } });
  return recent >= MAX_FAILED_LOGINS;
}

export async function recordFailedLogin(key: string) {
  await db.$transaction([
    // Attempts older than the window no longer count; removing them keeps the table small
    db.loginAttempt.deleteMany({ where: { createdAt: { lt: windowStart() } } }),
    db.loginAttempt.create({ data: { key } }),
  ]);
}

/** After a successful login the count starts again */
export async function clearFailedLogins(key: string) {
  await db.loginAttempt.deleteMany({ where: { key } });
}
