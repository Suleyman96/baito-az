import { z } from "zod";
import type { ResumeErrorKey } from "./resumes";

// Rules for applying and for who may see a CV; kept free of the database so they are unit-tested

export const APPLICATION_STATUSES = ["NEW", "REVIEWED", "ACCEPTED", "REJECTED"] as const;
export type ApplicationStatusValue = (typeof APPLICATION_STATUSES)[number];

export type ApplyErrorKey = ResumeErrorKey | "messageLong" | "jobUnavailable" | "seekersOnly";

/** A CV is required for full-time jobs only; part-time and one-day applications may go without. */
export function resumeRequired(employmentType: "FULL_TIME" | "PART_TIME" | "ONE_DAY") {
  return employmentType === "FULL_TIME";
}

export const applySchema = z.object({
  message: z
    .string()
    .trim()
    .max(1000, "messageLong")
    .transform((v) => v || undefined),
});

/** Why this seeker cannot apply to this job, or null when they can. */
export function applyProblem(job: { employmentType: "FULL_TIME" | "PART_TIME" | "ONE_DAY" }, hasResume: boolean): ApplyErrorKey | null {
  return resumeRequired(job.employmentType) && !hasResume ? "resumeRequired" : null;
}

type Viewer = { id: string; role: "SEEKER" | "EMPLOYER" | "ADMIN" } | null;

/**
 * May `viewer` open this CV? Its owner, admins, and employers it was sent to with an application.
 * `sentTo` = ids of the employers owning the jobs this CV was attached to.
 * Knowing the URL is never enough: every request is checked against the session.
 */
export function canViewResume(viewer: Viewer, resume: { ownerId: string; sentTo: string[] }) {
  if (!viewer) return false;
  if (viewer.role === "ADMIN" || viewer.id === resume.ownerId) return true;
  return viewer.role === "EMPLOYER" && resume.sentTo.includes(viewer.id);
}
