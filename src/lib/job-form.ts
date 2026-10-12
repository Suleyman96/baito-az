import { z } from "zod";
import { normalizePhone } from "@/lib/auth/validation";

// Error messages are dictionary keys (postJob.errors.*), translated in the form
export type JobFormErrorKey =
  | "titleRequired"
  | "descriptionRequired"
  | "categoryRequired"
  | "locationRequired"
  | "phoneInvalid"
  | "salaryInvalid"
  | "salaryRange"
  | "dateRequired"
  | "dateInPast"
  | "dateTooFar"
  | "durationInvalid"
  | "workersInvalid";

// Azerbaijan has no daylight saving time, so local time is always UTC+4
const BAKU_OFFSET = "+04:00";
const MAX_DAYS_AHEAD = 90;

// Empty form fields arrive as "" and mean "not provided"
const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalInt = (min: number, max: number, message: JobFormErrorKey) =>
  z.preprocess(blankToUndefined, z.coerce.number({ message }).int(message).min(min, message).max(max, message).optional());

const schema = z
  .object({
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "ONE_DAY"]).catch("FULL_TIME"),
    title: z.string().trim().min(3, "titleRequired").max(100, "titleRequired"),
    description: z.string().trim().min(10, "descriptionRequired").max(3000, "descriptionRequired"),
    categoryId: z.coerce.number({ message: "categoryRequired" }).int().positive("categoryRequired"),
    locationId: z.coerce.number({ message: "locationRequired" }).int().positive("locationRequired"),
    contactPhone: z.string().transform((v, ctx) => {
      const phone = normalizePhone(v);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "phoneInvalid" });
        return z.NEVER;
      }
      return phone;
    }),
    // Full-time / part-time: salary range per month or hour, both optional ("negotiable")
    salaryMin: optionalInt(1, 100000, "salaryInvalid"),
    salaryMax: optionalInt(1, 100000, "salaryInvalid"),
    // One-day jobs
    workDate: z.string().optional(),
    startTime: z.string().optional(),
    durationHours: optionalInt(1, 24, "durationInvalid"),
    workersNeeded: optionalInt(1, 100, "workersInvalid"),
    payAmount: optionalInt(1, 100000, "salaryInvalid"),
    payPeriod: z.enum(["JOB", "DAY", "HOUR"]).catch("JOB"),
    // Full-time / part-time: the salary range can be monthly, daily or hourly
    salaryPeriod: z.enum(["MONTH", "DAY", "HOUR"]).catch("MONTH"),
  });

export type JobFormData = {
  employmentType: "FULL_TIME" | "PART_TIME" | "ONE_DAY";
  title: string;
  description: string;
  categoryId: number;
  locationId: number;
  contactPhone: string;
  salaryMin: number | null;
  salaryMax: number | null;
  payPeriod: "MONTH" | "DAY" | "HOUR" | "JOB";
  workStart: Date | null;
  durationHours: number | null;
  workersNeeded: number | null;
};

type Result = { success: true; data: JobFormData } | { success: false; errors: Partial<Record<string, JobFormErrorKey>> };

/** Validates the "post a job" form. Fields of the other job type are ignored. */
export function parseJobForm(input: Record<string, unknown>, now = new Date()): Result {
  const type = schema.shape.employmentType.parse(input.employmentType);
  // Hidden fields of the other job type may still hold values; drop them before validating
  const ignored = type === "ONE_DAY" ? ["salaryMin", "salaryMax", "salaryPeriod"] : ["workDate", "startTime", "durationHours", "workersNeeded", "payAmount", "payPeriod"];
  const parsed = schema.safeParse(Object.fromEntries(Object.entries(input).filter(([k]) => !ignored.includes(k))));

  const errors: Partial<Record<string, JobFormErrorKey>> = {};
  const add = (field: string, key: JobFormErrorKey) => (errors[field] ??= key);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) add(String(issue.path[0]), issue.message as JobFormErrorKey);
  }

  const d = parsed.success ? parsed.data : undefined;
  let workStart: Date | null = null;

  if (type === "ONE_DAY") {
    const date = String(input.workDate ?? "");
    const time = String(input.startTime ?? "");
    workStart = /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time) ? new Date(`${date}T${time}:00${BAKU_OFFSET}`) : null;
    if (!workStart || Number.isNaN(workStart.getTime())) add("workDate", "dateRequired");
    else if (workStart <= now) add("workDate", "dateInPast");
    else if (workStart.getTime() - now.getTime() > MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000) add("workDate", "dateTooFar");
    if (d && d.durationHours === undefined) add("durationHours", "durationInvalid");
  } else if (d?.salaryMin && d.salaryMax && d.salaryMax < d.salaryMin) {
    add("salaryMax", "salaryRange");
  }

  if (!d || Object.keys(errors).length > 0) return { success: false, errors };

  const oneDay = type === "ONE_DAY";
  return {
    success: true,
    data: {
      employmentType: type,
      title: d.title,
      description: d.description,
      categoryId: d.categoryId,
      locationId: d.locationId,
      contactPhone: d.contactPhone,
      salaryMin: (oneDay ? d.payAmount : d.salaryMin) ?? null,
      salaryMax: oneDay ? null : (d.salaryMax ?? null),
      payPeriod: oneDay ? d.payPeriod : d.salaryPeriod,
      workStart: oneDay ? workStart : null,
      durationHours: oneDay ? (d.durationHours ?? null) : null,
      workersNeeded: oneDay ? (d.workersNeeded ?? 1) : null,
    },
  };
}

// Older jobs may have no phone of their own (the form then offers the company phone)
type StoredJob = Omit<JobFormData, "contactPhone"> & { contactPhone: string | null; location: { district: { slug: string } } };

/**
 * The form values of a saved job, the inverse of parseJobForm. Used to edit a job,
 * or to copy it as a new one (`copy`), which leaves a one-day job's date empty so a new one is picked.
 */
export function jobToFormValues(job: StoredJob, { copy = false } = {}): Record<string, string> {
  const str = (v: number | null) => (v === null ? "" : String(v));
  const oneDay = job.employmentType === "ONE_DAY";
  // Shown in Baku time, the same zone the form reads it in
  const [date, time] = job.workStart
    ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Baku", dateStyle: "short", timeStyle: "short" }).format(job.workStart).split(" ")
    : ["", ""];

  return {
    employmentType: job.employmentType,
    title: job.title,
    description: job.description,
    categoryId: String(job.categoryId),
    district: job.location.district.slug,
    locationId: String(job.locationId),
    ...(job.contactPhone ? { contactPhone: job.contactPhone } : {}),
    ...(oneDay
      ? {
          workDate: copy ? "" : date,
          startTime: time,
          durationHours: str(job.durationHours),
          workersNeeded: str(job.workersNeeded),
          payAmount: str(job.salaryMin),
          payPeriod: job.payPeriod,
        }
      : { salaryMin: str(job.salaryMin), salaryMax: str(job.salaryMax), salaryPeriod: job.payPeriod }),
  };
}
