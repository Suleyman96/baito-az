"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { APPLICATION_STATUSES, applyProblem, applySchema, type ApplyErrorKey } from "@/lib/applications";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { visible } from "@/lib/jobs";
import { notifyNewApplication } from "@/lib/notify";

export type ApplyState = { error?: ApplyErrorKey; applied?: boolean; message?: string } | undefined;

const langOf = (formData: FormData) => {
  const lang = String(formData.get("lang") ?? "");
  return hasLocale(lang) ? lang : defaultLocale;
};

/** A logged-in job seeker applies to a listed job with their current CV and an optional message. */
export async function applyToJob(jobId: string, _prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const lang = langOf(formData);
  const user = await getCurrentUser();
  // Not logged in: log in, then come back to this job
  if (!user) redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/jobs/${jobId}`)}`);
  if (user.role !== "SEEKER") return { error: "seekersOnly" };

  const parsed = applySchema.safeParse({ message: String(formData.get("message") ?? "") });
  const message = String(formData.get("message") ?? "");
  if (!parsed.success) return { error: "messageLong", message };

  // Only jobs that are publicly listed right now accept applications
  const job = await db.job.findFirst({ where: { id: jobId, ...visible(new Date()) }, select: { employmentType: true } });
  if (!job) return { error: "jobUnavailable" };
  const { resumeId } = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { resumeId: true } });
  const problem = applyProblem(job, !!resumeId);
  if (problem) return { error: problem, message };

  let applicationId: string;
  try {
    const application = await db.application.create({
      data: { jobId, userId: user.id, message: parsed.data.message, resumeId },
      select: { id: true },
    });
    applicationId = application.id;
  } catch (e) {
    // Already applied (a double click or a retried request): not an error, nothing new is created
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      refresh();
      return { applied: true };
    }
    throw e;
  }

  // Only after the application is saved; never fails the application (errors are recorded and logged)
  await notifyNewApplication(applicationId);
  refresh();
  return { applied: true };
}

/** The employer of the job sets an application's status. */
export async function updateApplicationStatus(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "EMPLOYER") redirect(`/${langOf(formData)}`);
  const status = String(formData.get("status") ?? "");
  if (!(APPLICATION_STATUSES as readonly string[]).includes(status)) return;

  // The job's owner in the filter: other employers' applications cannot be changed.
  // Once the job is completed, a hired worker stays hired: un-hiring them would take away their review of the employer
  await db.application.updateMany({
    where: { id: String(formData.get("id") ?? ""), job: { company: { ownerId: user.id } }, NOT: { status: "ACCEPTED", job: { status: "COMPLETED" } } },
    data: { status: status as (typeof APPLICATION_STATUSES)[number] },
  });
  refresh();
}
