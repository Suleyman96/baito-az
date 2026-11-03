"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { MAX_JOB_IMAGES, type ImageErrorKey } from "@/lib/images";
import { checkEndDate, monthlyExpiry, oneDayExpiry, type EndDateError } from "@/lib/job-expiry";
import { parseJobForm, parseWorkStart, type JobFormErrorKey } from "@/lib/job-form";
import { cleanText } from "@/lib/validation-rules";
import { readUploadedImages, type CheckedImage } from "@/lib/storage";

export type JobFormState = {
  errors: Partial<Record<string, JobFormErrorKey | ImageErrorKey>>;
  // Echoed back so the form keeps what the user typed
  values: Record<string, string>;
} | undefined;

const FIELDS = [
  "employmentType", "title", "description", "categoryId", "district", "locationId", "contactPhone",
  "salaryMin", "salaryMax", "salaryPeriod", "workDate", "startTime", "durationHours", "workersNeeded", "payAmount", "payPeriod", "endDate",
];

function langOf(formData: FormData) {
  const lang = String(formData.get("lang") ?? "");
  return hasLocale(lang) ? lang : defaultLocale;
}

/** The logged-in employer's company, or a redirect to where they can sort it out. */
async function requireEmployer(lang: string, back: string) {
  // Re-check the session here: the form being visible is not proof of permission
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login?next=${encodeURIComponent(back)}`);
  const company = user.role === "EMPLOYER" ? await db.company.findUnique({ where: { ownerId: user.id } }) : null;
  if (!company) redirect(`/${lang}/jobs/new`);
  return company;
}

/** Validates the job form; returns the data to save, or the state to show the form again. */
const textValues = (formData: FormData) => Object.fromEntries(FIELDS.map((k) => [k, String(formData.get(k) ?? "")]));

async function readJobForm(formData: FormData) {
  const values = textValues(formData);
  const result = parseJobForm(values);
  if (!result.success) return { state: { errors: result.errors, values } satisfies JobFormState };

  // Ids come from the browser, so make sure they exist
  const [category, location] = await Promise.all([
    db.category.findUnique({ where: { id: result.data.categoryId } }),
    db.location.findUnique({ where: { id: result.data.locationId } }),
  ]);
  if (!category) return { state: { errors: { categoryId: "categoryRequired" }, values } satisfies JobFormState };
  if (!location) return { state: { errors: { locationId: "locationRequired" }, values } satisfies JobFormState };
  return { data: result.data };
}

/**
 * New images from the form, checked. `keep` is how many saved images stay (edit),
 * so the total never goes over the limit.
 */
async function readJobImages(formData: FormData, keep: number): Promise<{ images: CheckedImage[] } | { error: ImageErrorKey }> {
  const upload = await readUploadedImages(formData.getAll("images"));
  if ("error" in upload) return upload;
  if (keep + upload.images.length > MAX_JOB_IMAGES) return { error: "imagesTooMany" };
  return upload;
}

export async function createJob(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
  const lang = langOf(formData);
  const company = await requireEmployer(lang, `/${lang}/jobs/new`);
  const form = await readJobForm(formData);
  if (!form.data) return form.state;
  const upload = await readJobImages(formData, 0);
  if ("error" in upload) return { errors: { images: upload.error }, values: textValues(formData) };

  // Job and images are written in one query, so a job never ends up with half its images
  await db.job.create({
    data: {
      ...form.data,
      companyId: company.id,
      status: "PENDING",
      images: { create: upload.images.map((image, position) => ({ ...image, position })) },
    },
  });
  redirect(`/${lang}/my/jobs?created=1`);
}

/**
 * Saves an edited job. Any edit sends it back to admin review, so an approved job cannot be changed into something else.
 * A completed job is final: editing it would take it out of COMPLETED and close its reviews.
 */
export async function updateJob(jobId: string, _prev: JobFormState, formData: FormData): Promise<JobFormState> {
  const lang = langOf(formData);
  const company = await requireEmployer(lang, `/${lang}/jobs/${jobId}/edit`);
  // companyId in the filter: employers can only change their own jobs
  const job = await db.job.findFirst({
    where: { id: jobId, companyId: company.id, status: { not: "COMPLETED" } },
    select: { employmentType: true, images: { select: { id: true, position: true }, orderBy: { position: "asc" } } },
  });
  if (!job) redirect(`/${lang}/my/jobs`);

  const form = await readJobForm(formData);
  if (!form.data) return form.state;
  // Only this job's own images can be removed; ids from the browser are matched against them
  const requested = new Set(formData.getAll("removeImage").map(String));
  const remove = job.images.filter((i) => requested.has(i.id)).map((i) => i.id);
  const kept = job.images.length - remove.length;
  const upload = await readJobImages(formData, kept);
  if ("error" in upload) return { errors: { images: upload.error }, values: textValues(formData) };

  const next = (job.images.at(-1)?.position ?? -1) + 1;
  await db.job.update({
    // Checked again here: the job may have been completed while the form was being filled in
    where: { id: jobId, status: { not: "COMPLETED" } },
    data: {
      ...form.data,
      // A one-day job turned into a monthly one starts its month at approval; a monthly one keeps its month
      ...(job.employmentType === "ONE_DAY" && form.data.employmentType !== "ONE_DAY" ? { expiresAt: null, publishedAt: null } : {}),
      status: "PENDING",
      rejectReason: null,
      images: {
        deleteMany: { id: { in: remove } },
        create: upload.images.map((image, i) => ({ ...image, position: next + i })),
      },
    },
  });
  redirect(`/${lang}/my/jobs?updated=1`);
}

/** Employer closes their own published job ("worker found"). */
export async function closeOwnJob(formData: FormData) {
  const lang = langOf(formData);
  const company = await requireEmployer(lang, `/${lang}/my/jobs`);
  await db.job.updateMany({ where: { id: String(formData.get("id") ?? ""), companyId: company.id, status: "ACTIVE" }, data: { status: "CLOSED" } });
  refresh();
}

/**
 * Employer reopens a closed job. It goes through admin review again: the job may
 * have been taken down by an admin, and closing must not be a way around that.
 */
export async function reopenOwnJob(formData: FormData) {
  const lang = langOf(formData);
  const company = await requireEmployer(lang, `/${lang}/my/jobs`);
  await db.job.updateMany({ where: { id: String(formData.get("id") ?? ""), companyId: company.id, status: "CLOSED" }, data: { status: "PENDING" } });
  refresh();
}

/**
 * Employer marks their job as done. Reviews then open between the employer and the workers they accepted.
 * Only published, closed or archived jobs can be completed; a completed job leaves the public listings.
 */
export async function completeOwnJob(formData: FormData) {
  const lang = langOf(formData);
  const company = await requireEmployer(lang, `/${lang}/my/jobs`);
  await db.job.updateMany({
    where: { id: String(formData.get("id") ?? ""), companyId: company.id, status: { in: ["ACTIVE", "CLOSED", "ARCHIVED"] } },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  refresh();
}

export type ReactivateState = { errors: Partial<Record<"workDate" | "endDate", JobFormErrorKey | EndDateError>>; values: Record<string, string> } | undefined;

// Archived, or past its end and waiting for the archive run
const expired = (now: Date) => ({ OR: [{ status: "ARCHIVED" as const }, { status: "ACTIVE" as const, expiresAt: { lte: now } }] });

/**
 * Employer puts an archived job back on the site, with a new listing period. Its content was approved
 * before and is unchanged, so it goes live without a new review. Full-time / part-time: one month from now.
 * One-day: a work date in the future (the old one has usually passed) and an optional new end date.
 */
export async function reactivateJob(_prev: ReactivateState, formData: FormData): Promise<ReactivateState> {
  const lang = langOf(formData);
  const company = await requireEmployer(lang, `/${lang}/my/jobs`);
  const now = new Date();
  const id = String(formData.get("id") ?? "");
  const job = await db.job.findFirst({ where: { id, companyId: company.id, ...expired(now) }, select: { employmentType: true } });
  if (!job) {
    refresh();
    return undefined;
  }

  let listing: { expiresAt: Date; workStart?: Date; endDate?: Date | null };
  if (job.employmentType === "ONE_DAY") {
    const values = { workDate: String(formData.get("workDate") ?? ""), startTime: String(formData.get("startTime") ?? ""), endDate: String(formData.get("endDate") ?? "") };
    const start = parseWorkStart(values.workDate, values.startTime, now);
    if ("error" in start) return { errors: { workDate: start.error }, values };
    const end = checkEndDate(values.endDate, start.workStart, now);
    if ("error" in end) return { errors: { endDate: end.error }, values };
    listing = {
      workStart: start.workStart,
      endDate: end.endDate ? new Date(`${end.endDate}T00:00:00Z`) : null,
      expiresAt: oneDayExpiry(start.workStart, end.endDate),
    };
  } else {
    listing = { expiresAt: monthlyExpiry(now) };
  }

  // The same conditions again: a double click or a second tab cannot reactivate it twice
  await db.job.updateMany({
    where: { id, companyId: company.id, ...expired(now) },
    data: { ...listing, status: "ACTIVE", publishedAt: now, archivedAt: null },
  });
  refresh();
  return undefined;
}

async function requireAdmin(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect(`/${langOf(formData)}`);
  return user;
}

/** Admin approves or rejects a pending job. A rejection can carry a reason for the employer. */
export async function reviewJob(formData: FormData) {
  await requireAdmin(formData);
  const id = String(formData.get("id") ?? "");
  const approve = formData.get("decision") === "approve";
  const reason = cleanText(String(formData.get("reason") ?? "")).slice(0, 300) || null;
  if (!approve) {
    // Only pending jobs can be reviewed, so a double click cannot flip a decision
    await db.job.updateMany({ where: { id, status: "PENDING" }, data: { status: "REJECTED", rejectReason: reason } });
    refresh();
    return;
  }
  const job = await db.job.findFirst({ where: { id, status: "PENDING" }, select: { employmentType: true, expiresAt: true } });
  if (!job) return refresh();
  const now = new Date();
  // A monthly job starts its month now, unless an edit of a published job is being approved while its
  // month is still running. A one-day job's end was set from its dates when it was saved
  const renew = job.employmentType !== "ONE_DAY" && (!job.expiresAt || job.expiresAt <= now);
  await db.job.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "ACTIVE", rejectReason: null, archivedAt: null, ...(renew ? { publishedAt: now, expiresAt: monthlyExpiry(now) } : {}) },
  });
  refresh();
}

/** Admin takes a published job off the site, e.g. after a complaint. */
export async function closeJob(formData: FormData) {
  await requireAdmin(formData);
  await db.job.updateMany({ where: { id: String(formData.get("id") ?? ""), status: "ACTIVE" }, data: { status: "CLOSED" } });
  refresh();
}

/** Admin blocks or unblocks a user. Blocked users are logged out everywhere; admins cannot be blocked. */
export async function setUserBlocked(formData: FormData) {
  await requireAdmin(formData);
  const id = String(formData.get("id") ?? "");
  const block = formData.get("block") === "1";
  const { count } = await db.user.updateMany({
    where: { id, role: { not: "ADMIN" } },
    data: { blockedAt: block ? new Date() : null },
  });
  if (block && count > 0) await db.session.deleteMany({ where: { userId: id } });
  refresh();
}
