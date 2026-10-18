import "server-only";
import { db } from "@/lib/db";

const employerSelect = { id: true, name: true, avatarId: true, company: { select: { id: true, name: true } } } as const;
const jobSelect = { id: true, title: true, status: true } as const;

/** Offers a job seeker received, newest first. Contact details of either side are not included. */
export function getReceivedOffers(workerId: string) {
  return db.jobOffer.findMany({
    where: { workerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      status: true,
      reply: true,
      respondedAt: true,
      seenAt: true,
      createdAt: true,
      employer: { select: employerSelect },
      job: { select: jobSelect },
    },
  });
}

/** Offers an employer sent, newest first, with the job seeker's answer. */
export function getSentOffers(employerId: string) {
  return db.jobOffer.findMany({
    where: { employerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      status: true,
      reply: true,
      respondedAt: true,
      replySeenAt: true,
      createdAt: true,
      worker: { select: { id: true, name: true, avatarId: true } },
      job: { select: jobSelect },
    },
  });
}

/** Opening the offers page marks what it shows as seen (the menu badge counts the rest). */
export async function markOffersSeen(userId: string, role: "SEEKER" | "EMPLOYER") {
  const now = new Date();
  if (role === "SEEKER") await db.jobOffer.updateMany({ where: { workerId: userId, seenAt: null }, data: { seenAt: now } });
  else await db.jobOffer.updateMany({ where: { employerId: userId, respondedAt: { not: null }, replySeenAt: null }, data: { replySeenAt: now } });
}

/** New offers (job seeker) or new answers (employer) not yet seen. */
export function getUnseenOfferCount(userId: string, role: string) {
  if (role === "SEEKER") return db.jobOffer.count({ where: { workerId: userId, seenAt: null } });
  if (role === "EMPLOYER") return db.jobOffer.count({ where: { employerId: userId, respondedAt: { not: null }, replySeenAt: null } });
  return Promise.resolve(0);
}

/** The employer's open jobs an offer can be about. */
export function getOfferableJobs(employerId: string) {
  return db.job.findMany({ where: { status: "ACTIVE", company: { ownerId: employerId } }, orderBy: { createdAt: "desc" }, select: { id: true, title: true } });
}
