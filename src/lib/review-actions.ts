"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getJobForReview } from "@/lib/review-queries";
import { reviewProblem, reviewSchema, type ReviewErrorKey } from "@/lib/reviews";

export type ReviewFormState = { error?: ReviewErrorKey; saved?: boolean; values?: { rating: string; comment: string } } | undefined;

/**
 * The logged-in user reviews `subjectId` for a completed job. The author always comes from the
 * session; eligibility, input and "one review per job and person" are all checked here and in the database.
 */
export async function submitReview(jobId: string, subjectId: string, _prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const lang = String(formData.get("lang") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/${hasLocale(lang) ? lang : defaultLocale}/login`);

  const values = { rating: String(formData.get("rating") ?? ""), comment: String(formData.get("comment") ?? "") };
  const job = await getJobForReview(jobId);
  const problem = job ? reviewProblem(job, user.id, subjectId) : "notParticipant";
  if (problem) return { error: problem, values };

  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message as ReviewErrorKey, values };

  try {
    await db.review.create({ data: { jobId, authorId: user.id, subjectId, ...parsed.data } });
  } catch (e) {
    // The unique index: this person was already reviewed for this job (double submit or a second tab)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "alreadyReviewed" };
    throw e;
  }
  refresh();
  return { saved: true };
}
