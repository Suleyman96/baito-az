import { z } from "zod";
import { isProfession, isProfessionGroup } from "@/config/professions";
import { isDistrict } from "@/config/site";

// Query-string filters of the "İş axtaranlar" directory. Like the job filters: invalid values are ignored.

export const EXPERIENCE_STEPS = [1, 3, 5, 10] as const;

const filtersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  group: z.string().refine(isProfessionGroup).optional().catch(undefined),
  profession: z.string().refine(isProfession).optional().catch(undefined),
  district: z.string().refine(isDistrict).optional().catch(undefined),
  type: z.enum(["FULL_TIME", "PART_TIME", "ONE_DAY"]).optional().catch(undefined),
  /** Minimum years of experience */
  exp: z.coerce.number().refine((n) => (EXPERIENCE_STEPS as readonly number[]).includes(n)).optional().catch(undefined),
  pay: z.enum(["MONTH", "DAY", "HOUR"]).optional().catch(undefined),
  /** Highest expected pay the employer can offer, in the chosen period */
  payMax: z.coerce.number().int().min(1).max(100000).optional().catch(undefined),
  avail: z.enum(["now", "weekdays", "weekends"]).optional().catch(undefined),
  sort: z.enum(["relevance", "rating"]).catch("relevance").default("relevance"),
  page: z.coerce.number().int().min(1).max(1000).catch(1).default(1),
});

export type WorkerFilters = z.infer<typeof filtersSchema>;

export function parseWorkerFilters(searchParams: Record<string, string | string[] | undefined>): WorkerFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  const filters = filtersSchema.parse(Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, first(v)])));
  // An amount without a period is read as monthly, as in the job filters
  if (filters.payMax && !filters.pay) filters.pay = "MONTH";
  return filters;
}

/** Link to the directory with some filters changed; any change goes back to page 1. */
export function workerFiltersHref(lang: string, filters: Partial<WorkerFilters>, change: Partial<Record<keyof WorkerFilters, string | number | undefined>> = {}) {
  const next: Record<string, unknown> = { ...filters, page: undefined, ...change };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value === undefined || value === "" || (key === "page" && value === 1) || (key === "sort" && value === "relevance")) continue;
    query.set(key, String(value));
  }
  const qs = query.toString();
  return `/${lang}/workers${qs ? `?${qs}` : ""}`;
}
