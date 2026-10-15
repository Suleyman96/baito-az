import { z } from "zod";

// Who may review whom, and what a review must contain; no database here, so it is unit-tested

export type ReviewErrorKey = "ratingInvalid" | "commentShort" | "commentLong" | "notCompleted" | "notParticipant" | "selfReview" | "alreadyReviewed";

export const reviewSchema = z.object({
  rating: z.coerce.number({ message: "ratingInvalid" }).int("ratingInvalid").min(1, "ratingInvalid").max(5, "ratingInvalid"),
  comment: z.string().trim().min(5, "commentShort").max(1000, "commentLong"),
});

type JobForReview = { status: string; ownerId: string; hiredWorkerIds: string[] };

/**
 * Why `authorId` may not review `subjectId` for this job, or null when they may.
 * Reviews open only after the employer marks the job completed, and only between the
 * employer and a worker they accepted for it, in either direction.
 */
export function reviewProblem(job: JobForReview, authorId: string, subjectId: string): ReviewErrorKey | null {
  if (authorId === subjectId) return "selfReview";
  if (job.status !== "COMPLETED") return "notCompleted";
  const employerToWorker = authorId === job.ownerId && job.hiredWorkerIds.includes(subjectId);
  const workerToEmployer = job.hiredWorkerIds.includes(authorId) && subjectId === job.ownerId;
  return employerToWorker || workerToEmployer ? null : "notParticipant";
}

/** Everyone `authorId` may review for this job: the employer reviews each hired worker, a worker reviews the employer. */
export function reviewTargets(job: JobForReview, authorId: string): string[] {
  if (job.status !== "COMPLETED") return [];
  if (authorId === job.ownerId) return job.hiredWorkerIds.filter((id) => id !== authorId);
  return job.hiredWorkerIds.includes(authorId) ? [job.ownerId] : [];
}

/** Average rounded to one decimal (4.67 → 4.7) and the number of reviews; null average when there are none. */
export function summarizeRatings(ratings: number[]) {
  if (ratings.length === 0) return { average: null, count: 0 };
  const average = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
  return { average, count: ratings.length };
}
