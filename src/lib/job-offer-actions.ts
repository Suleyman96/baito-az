"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { OFFERS_PER_DAY, parseOffer, parseReply, type OfferErrorKey } from "@/lib/job-offers";

export type OfferFormState = {
  errors: Partial<Record<string, OfferErrorKey>>;
  values: Record<string, string>;
  sent?: boolean;
} | undefined;

const text = (formData: FormData, keys: string[]) => Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));

/**
 * An employer's offer to the job seeker `workerId`. Everything is checked here, not in the page:
 * a logged-in, unblocked employer; never their own account; only a job seeker whose profile is
 * public; and, if a job is named, one of the employer's own open jobs.
 */
export async function sendJobOffer(workerId: string, _prev: OfferFormState, formData: FormData): Promise<OfferFormState> {
  const values = text(formData, ["message", "jobId"]);
  const user = await getCurrentUser();
  if (!user) return { errors: { form: "loginRequired" }, values };
  if (user.id === workerId) return { errors: { form: "ownProfile" }, values };
  if (user.role !== "EMPLOYER") return { errors: { form: "employersOnly" }, values };

  const parsed = parseOffer(values);
  if (!parsed.success) return { errors: parsed.errors, values };
  const { message, jobId } = parsed.data;

  const worker = await db.user.findFirst({
    where: { id: workerId, role: "SEEKER", blockedAt: null, workerProfile: { visible: true } },
    select: { id: true },
  });
  if (!worker) return { errors: { form: "notAvailable" }, values };

  if (jobId) {
    const job = await db.job.findFirst({ where: { id: jobId, status: "ACTIVE", company: { ownerId: user.id } }, select: { id: true } });
    if (!job) return { errors: { jobId: "jobInvalid" }, values };
  }

  // One open offer per employer, job seeker and job: a double click or a resend does not repeat it
  const open = await db.jobOffer.findFirst({ where: { employerId: user.id, workerId, jobId, status: "PENDING" }, select: { id: true } });
  if (open) return { errors: { form: "alreadySent" }, values };
  const recent = await db.jobOffer.count({ where: { employerId: user.id, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
  if (recent >= OFFERS_PER_DAY) return { errors: { form: "tooMany" }, values };

  await db.jobOffer.create({ data: { employerId: user.id, workerId, jobId, message } });
  refresh();
  return { errors: {}, values: {}, sent: true };
}

/** The job seeker accepts or declines an offer they received, with an optional answer. */
export async function respondToOffer(offerId: string, _prev: OfferFormState, formData: FormData): Promise<OfferFormState> {
  const lang = String(formData.get("lang") ?? "");
  const values = text(formData, ["decision", "reply"]);
  const user = await getCurrentUser();
  if (!user) redirect(`/${hasLocale(lang) ? lang : defaultLocale}/login`);

  const parsed = parseReply(values);
  if (!parsed.success) return { errors: parsed.errors, values };

  // Only the offer's own recipient, and only while it is still open
  const { count } = await db.jobOffer.updateMany({
    where: { id: offerId, workerId: user.id, status: "PENDING" },
    data: { status: parsed.data.status, reply: parsed.data.reply, respondedAt: new Date() },
  });
  if (count === 0) return { errors: { form: "offerClosed" }, values };
  refresh();
  return { errors: {}, values: {}, sent: true };
}
