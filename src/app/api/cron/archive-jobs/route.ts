import { timingSafeEqual } from "node:crypto";
import { archiveExpiredJobs, sendArchiveEmails } from "@/lib/job-archive";

// Archiving can take a while with many jobs and emails
export const maxDuration = 60;

/** Only the scheduler, which sends "Authorization: Bearer <CRON_SECRET>" (Vercel Cron does this by itself) */
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * The scheduled archive run (vercel.json → crons): archives jobs whose listing period ended and emails
 * their employers, retrying failed emails. Listings already hide such jobs at their end time; this makes
 * it final and sends the email.
 */
export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  const now = new Date();
  const archived = await archiveExpiredJobs(now);
  const emails = await sendArchiveEmails(now);
  return Response.json({ archived, emails }, { headers: { "Cache-Control": "no-store" } });
}
