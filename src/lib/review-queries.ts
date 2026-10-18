import "server-only";
import { db } from "@/lib/db";
import { reviewTargets } from "@/lib/reviews";

const person = { select: { id: true, name: true, avatarId: true, role: true, company: { select: { id: true, name: true } } } } as const;

/** Average stars (one decimal) and number of reviews a user has received. */
export async function getRatingSummary(userId: string) {
  const { _avg, _count } = await db.review.aggregate({ where: { subjectId: userId }, _avg: { rating: true }, _count: true });
  return { average: _avg.rating === null ? null : Math.round(_avg.rating * 10) / 10, count: _count };
}

/** Reviews a user has received, newest first, with who wrote them and for which job. */
export function getReviewsAbout(userId: string) {
  return db.review.findMany({
    where: { subjectId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, rating: true, comment: true, createdAt: true, author: person, job: { select: { title: true } } },
  });
}

/** Reviews this user has written. */
export function getReviewsBy(userId: string) {
  return db.review.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, rating: true, comment: true, createdAt: true, subject: person, job: { select: { title: true } } },
  });
}

/** A completed job with what is needed to decide who may review whom. */
export async function getJobForReview(jobId: string) {
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      status: true,
      company: { select: { ownerId: true } },
      // "Hired" = applications the employer accepted
      applications: { where: { status: "ACCEPTED" }, select: { userId: true } },
    },
  });
  return job && { id: job.id, title: job.title, status: job.status, ownerId: job.company.ownerId, hiredWorkerIds: job.applications.map((a) => a.userId) };
}

/** Reviews this user can still write: one entry per completed job and person, minus those already written. */
export async function getPendingReviews(userId: string) {
  const jobs = await db.job.findMany({
    where: {
      status: "COMPLETED",
      OR: [{ company: { ownerId: userId } }, { applications: { some: { userId, status: "ACCEPTED" } } }],
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      title: true,
      completedAt: true,
      company: { select: { ownerId: true } },
      applications: { where: { status: "ACCEPTED" }, select: { userId: true } },
      reviews: { where: { authorId: userId }, select: { subjectId: true } },
    },
  });

  const pending = jobs.flatMap((job) => {
    const done = new Set(job.reviews.map((r) => r.subjectId));
    const targets = reviewTargets({ status: "COMPLETED", ownerId: job.company.ownerId, hiredWorkerIds: job.applications.map((a) => a.userId) }, userId);
    return targets.filter((id) => !done.has(id)).map((subjectId) => ({ job: { id: job.id, title: job.title, completedAt: job.completedAt }, subjectId }));
  });
  const people = await db.user.findMany({ where: { id: { in: [...new Set(pending.map((p) => p.subjectId))] } }, ...person });
  const byId = new Map(people.map((p) => [p.id, p]));
  return pending.flatMap((p) => {
    const subject = byId.get(p.subjectId);
    return subject ? [{ job: p.job, subject }] : [];
  });
}

/** A job seeker's public profile: no contacts, no CV. Null for other roles and blocked users. */
export function getWorkerProfile(id: string) {
  return db.user.findFirst({
    where: { id, role: "SEEKER", blockedAt: null, deletedAt: null },
    select: { id: true, name: true, avatarId: true, createdAt: true },
  });
}

/** Rating summaries for several users at once (e.g. the companies list), keyed by user id. */
export async function getRatingSummaries(userIds: string[]) {
  const rows = await db.review.groupBy({ by: ["subjectId"], where: { subjectId: { in: userIds } }, _avg: { rating: true }, _count: true });
  return new Map(rows.map((r) => [r.subjectId, { average: r._avg.rating === null ? null : Math.round(r._avg.rating * 10) / 10, count: r._count }]));
}
