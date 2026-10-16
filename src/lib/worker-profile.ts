import { z } from "zod";
import { AGE_RANGES, isProfession, isSkill } from "@/config/professions";
import { site } from "@/config/site";
import { normalizePhone } from "@/lib/auth/validation";

// Rules for the job seeker's work profile; no database here, so it is unit-tested

export type WorkerProfileErrorKey =
  | "nameRequired"
  | "phoneRequired"
  | "phoneInvalid"
  | "professionRequired"
  | "tooManyProfessions"
  | "tooManySkills"
  | "districtRequired"
  | "numberInvalid"
  | "workTypeRequired"
  | "dateInvalid"
  | "textTooLong";

export const MAX_EXTRA_PROFESSIONS = 5;
export const MAX_SKILLS = 15;
const DISTRICTS = Object.keys(site.districts);

/** Form input: single fields as strings, multi-select fields as string arrays. */
export type ProfileInput = Record<string, string | string[] | undefined>;

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "textTooLong")
    .transform((v) => v || null);
const optionalInt = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (!v) return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: "numberInvalid" });
        return z.NEVER;
      }
      return n;
    });
const list = (valid: (v: string) => boolean) => z.array(z.string()).transform((vs) => [...new Set(vs.filter(valid))]);
const checkbox = z.string().transform((v) => v === "on" || v === "true" || v === "1");

const schema = z.object({
  name: z.string().trim().min(2, "nameRequired").max(80, "nameRequired"),
  phone: z.string().transform((v, ctx) => {
    if (!v.trim()) {
      ctx.addIssue({ code: "custom", message: "phoneRequired" });
      return z.NEVER;
    }
    const phone = normalizePhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "phoneInvalid" });
      return z.NEVER;
    }
    return phone;
  }),
  ageRange: z.string().transform((v) => ((AGE_RANGES as readonly string[]).includes(v) ? v : null)),
  bio: text(500),
  primaryProfession: z.string().refine(isProfession, "professionRequired"),
  additionalProfessions: list(isProfession),
  skills: list(isSkill),
  experienceYears: optionalInt(0, 60),
  workHistory: text(2000),
  certificates: text(1000),
  district: z.string().refine((v) => DISTRICTS.includes(v), "districtRequired"),
  locationId: optionalInt(1, 1_000_000),
  preferredDistricts: list((v) => DISTRICTS.includes(v)),
  maxCommuteKm: optionalInt(0, 300),
  willingToRelocate: checkbox,
  workTypes: z.array(z.enum(["FULL_TIME", "PART_TIME", "ONE_DAY"])).min(1, "workTypeRequired"),
  availableFrom: z.string().transform((v, ctx) => {
    if (!v) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00+04:00`) : null;
    if (!date || Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "dateInvalid" });
      return z.NEVER;
    }
    return date;
  }),
  availableWeekdays: checkbox,
  availableWeekends: checkbox,
  expectedPay: optionalInt(1, 100_000),
  expectedPayPeriod: z.enum(["MONTH", "DAY", "HOUR"]).catch("MONTH"),
  workplace: z.enum(["ONSITE", "REMOTE", "ANY"]).catch("ONSITE"),
  visible: checkbox,
});

export type WorkerProfileData = z.output<typeof schema>;

const SINGLE = [
  "name", "phone", "ageRange", "bio", "primaryProfession", "experienceYears", "workHistory", "certificates", "district",
  "locationId", "maxCommuteKm", "willingToRelocate", "availableFrom", "availableWeekdays", "availableWeekends",
  "expectedPay", "expectedPayPeriod", "workplace", "visible",
] as const;
/** Form value of the expected-pay select meaning the pay is agreed with the employer */
export const NEGOTIABLE = "NEGOTIABLE";

const MULTI = ["additionalProfessions", "skills", "preferredDistricts", "workTypes"] as const;

/**
 * Validates the work profile form. Unknown codes in multi-selects are dropped rather than failing;
 * the primary profession is never also listed as an additional one.
 */
export function parseWorkerProfile(input: ProfileInput):
  | { success: true; data: WorkerProfileData }
  | { success: false; errors: Partial<Record<string, WorkerProfileErrorKey>> } {
  const one = (k: string) => {
    const v = input[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };
  const many = (k: string) => {
    const v = input[k];
    return Array.isArray(v) ? v : v ? [v] : [];
  };
  const raw = Object.fromEntries([...SINGLE.map((k) => [k, one(k)]), ...MULTI.map((k) => [k, many(k)])]);
  // "Negotiable" is stored as no expected amount (shown as negotiable everywhere); the period keeps its default
  if (raw.expectedPayPeriod === NEGOTIABLE) Object.assign(raw, { expectedPay: "", expectedPayPeriod: "MONTH" });
  const parsed = schema.safeParse(raw);
  const errors: Partial<Record<string, WorkerProfileErrorKey>> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message as WorkerProfileErrorKey;
    return { success: false, errors };
  }

  const data = parsed.data;
  data.additionalProfessions = data.additionalProfessions.filter((p) => p !== data.primaryProfession);
  if (data.additionalProfessions.length > MAX_EXTRA_PROFESSIONS) errors.additionalProfessions = "tooManyProfessions";
  if (data.skills.length > MAX_SKILLS) errors.skills = "tooManySkills";
  return Object.keys(errors).length ? { success: false, errors } : { success: true, data };
}
