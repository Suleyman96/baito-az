import "server-only";
import { db } from "@/lib/db";
import { getDictionary } from "@/i18n/dictionaries";
import { mailer } from "@/lib/mailer";
import { appUrl, buildArchiveEmail, deliver } from "@/lib/notification-email";

// The scheduled archive run (src/app/api/cron/archive-jobs/route.ts). Safe to run often, twice at once,
// or after missed runs: every step checks the current state before changing it.

/** Sending attempts per archive email; after that it stays FAILED */
export const MAX_ARCHIVE_EMAIL_ATTEMPTS = 5;
/** How long one run may hold an email it is sending before another run may try it */
const SEND_LOCK_MS = 10 * 60 * 1000;
/** After a failed attempt, the earliest retry: a run starting at the same time does not try again at once */
const RETRY_AFTER_MS = 60 * 60 * 1000;
const BATCH = 200;

/**
 * Archives published jobs whose listing period has ended. Each job is archived once: the status change
 * only applies while it is still ACTIVE, and its email record is created in the same transaction.
 */
export async function archiveExpiredJobs(now = new Date()) {
  const due = await db.job.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: now } },
    orderBy: { expiresAt: "asc" },
    take: BATCH,
    select: { id: true },
  });
  let archived = 0;
  for (const { id } of due) {
    const done = await db.$transaction(async (tx) => {
      const { count } = await tx.job.updateMany({ where: { id, status: "ACTIVE", expiresAt: { lte: now } }, data: { status: "ARCHIVED", archivedAt: now } });
      if (count === 0) return false; // another run, the employer or an admin got there first
      await tx.jobArchiveNotice.create({ data: { jobId: id, archivedAt: now } });
      return true;
    });
    if (done) archived++;
  }
  return archived;
}

type Counts = Record<"SENT" | "FAILED" | "NOT_CONFIGURED" | "NO_ADDRESS", number>;

/**
 * Emails the employers of archived jobs: new emails, and failed ones again (an hour later at the earliest)
 * until the attempt limit.
 * Each email is claimed by one run before sending; a sent, unconfigured or address-less one is final.
 * Without an email service the result is recorded as NOT_CONFIGURED, never as sent.
 */
export async function sendArchiveEmails(now = new Date()) {
  const open = {
    emailStatus: { in: ["PENDING" as const, "FAILED" as const] },
    attempts: { lt: MAX_ARCHIVE_EMAIL_ATTEMPTS },
    OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
  };
  const notices = await db.jobArchiveNotice.findMany({ where: open, orderBy: { createdAt: "asc" }, take: BATCH, select: { id: true } });
  const counts: Counts = { SENT: 0, FAILED: 0, NOT_CONFIGURED: 0, NO_ADDRESS: 0 };
  const types = getDictionary("az").jobType;

  for (const { id } of notices) {
    const { count } = await db.jobArchiveNotice.updateMany({
      where: { id, ...open },
      data: { lockedUntil: new Date(now.getTime() + SEND_LOCK_MS), attempts: { increment: 1 } },
    });
    if (count === 0) continue; // claimed by another run meanwhile

    const notice = await db.jobArchiveNotice.findUniqueOrThrow({
      where: { id },
      select: {
        emailStatus: true,
        archivedAt: true,
        job: { select: { title: true, employmentType: true, company: { select: { owner: { select: { email: true } } } } } },
      },
    });
    const to = notice.job.company.owner.email;
    const email = to
      ? buildArchiveEmail({
          to,
          jobTitle: notice.job.title,
          jobType: types[notice.job.employmentType],
          archivedAt: notice.archivedAt,
          link: `${appUrl()}/az/my/jobs`,
          idempotencyKey: `job-archive/${id}`,
        })
      : null;
    const result = await deliver(notice.emailStatus, email, mailer);
    if (!result) continue;
    if (result.emailStatus === "FAILED") console.error("Could not send the archive email", id, result.emailError);
    await db.jobArchiveNotice.update({
      where: { id },
      // emailError: null unless this attempt failed, so an old error does not stay on a later result
      data: { emailError: null, ...result, lockedUntil: result.emailStatus === "FAILED" ? new Date(Date.now() + RETRY_AFTER_MS) : null },
    });
    if (result.emailStatus !== "PENDING") counts[result.emailStatus]++;
  }
  return counts;
}
