import "server-only";
import { db } from "@/lib/db";

// Every employer query filters by the job's owner, so an employer only ever reads applications to their own jobs

const applicant = { select: { id: true, name: true, avatarId: true } } as const;

/** This seeker's application to this job, if any (shown on the job page). */
export function getMyApplication(jobId: string, userId: string) {
  return db.application.findUnique({ where: { jobId_userId: { jobId, userId } }, select: { status: true, createdAt: true } });
}

/** A job seeker's own applications, newest first. */
export function getSeekerApplications(userId: string) {
  return db.application.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      resume: { select: { fileName: true } },
      job: { select: { id: true, title: true, status: true, company: { select: { name: true } } } },
    },
  });
}

/** Applications received by an employer, optionally for one of their jobs. */
export function getEmployerApplications(employerId: string, jobId?: string) {
  return db.application.findMany({
    where: { job: { id: jobId, company: { ownerId: employerId } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      resumeId: true,
      user: applicant,
      job: { select: { id: true, title: true } },
      notification: { select: { readAt: true } },
    },
  });
}

/** One application for its employer, with the applicant's profile and contacts; null for anyone else. */
export function getEmployerApplication(employerId: string, applicationId: string) {
  return db.application.findFirst({
    where: { id: applicationId, job: { company: { ownerId: employerId } } },
    select: {
      id: true,
      status: true,
      message: true,
      createdAt: true,
      updatedAt: true,
      resume: { select: { id: true, fileName: true, mimeType: true, size: true } },
      user: { select: { id: true, name: true, avatarId: true, email: true, phone: true, createdAt: true } },
      job: { select: { id: true, title: true, employmentType: true, status: true } },
    },
  });
}

/** The employer opened this application: its notification no longer counts as new. */
export async function markApplicationSeen(employerId: string, applicationId: string) {
  await db.notification.updateMany({ where: { applicationId, userId: employerId, readAt: null }, data: { readAt: new Date() } });
}

/** Number of applications the employer has not opened yet (header badge). */
export function getUnseenApplicationCount(employerId: string) {
  return db.notification.count({ where: { userId: employerId, readAt: null } });
}

/** The seeker's current CV, for the profile page and the apply form. */
export function getCurrentResume(userId: string) {
  return db.user
    .findUniqueOrThrow({ where: { id: userId }, select: { resume: { select: { id: true, fileName: true, mimeType: true, size: true, createdAt: true } } } })
    .then((u) => u.resume);
}
