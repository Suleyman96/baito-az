import { z } from "zod";

// Query string values are untrusted: anything invalid is silently ignored
const filtersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  type: z.enum(["FULL_TIME", "PART_TIME", "ONE_DAY"]).optional().catch(undefined),
  category: z.string().max(50).optional().catch(undefined),
  district: z.string().max(50).optional().catch(undefined),
  location: z.coerce.number().int().positive().optional().catch(undefined),
  // Pay: amounts only make sense within one pay period (500 a month vs 8 an hour)
  pay: z.enum(["MONTH", "DAY", "HOUR", "JOB"]).optional().catch(undefined),
  payMin: z.coerce.number().int().min(1).max(100000).optional().catch(undefined),
  payMax: z.coerce.number().int().min(1).max(100000).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1).default(1),
});

export type JobFilters = z.infer<typeof filtersSchema>;

export function parseJobFilters(
  searchParams: Record<string, string | string[] | undefined>,
): JobFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  const filters = filtersSchema.parse(
    Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, first(v)])),
  );
  // A reversed range is a typo, not an empty search
  if (filters.payMin && filters.payMax && filters.payMin > filters.payMax) {
    [filters.payMin, filters.payMax] = [filters.payMax, filters.payMin];
  }
  // Amounts without a period are read as monthly, the most common case
  if ((filters.payMin || filters.payMax) && !filters.pay) filters.pay = "MONTH";
  return filters;
}

/**
 * Link to the job list (/{lang}/jobs) with `filters` changed by `change` (undefined removes a filter).
 * Changing any filter goes back to page 1; empty values are left out of the URL.
 */
export function filtersHref(lang: string, filters: Partial<JobFilters>, change: Partial<Record<keyof JobFilters, string | number | undefined>> = {}) {
  const next: Record<string, unknown> = { ...filters, page: undefined, ...change };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value !== undefined && value !== "" && !(key === "page" && value === 1)) query.set(key, String(value));
  }
  const qs = query.toString();
  return `/${lang}/jobs${qs ? `?${qs}` : ""}`;
}

/** True when any filter besides the page number is set. */
export function hasActiveFilters(filters: JobFilters) {
  return Object.entries(filters).some(([key, value]) => key !== "page" && value !== undefined);
}
