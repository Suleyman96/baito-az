import { z } from "zod";

// Query string values are untrusted: anything invalid is silently ignored
const filtersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  type: z.enum(["FULL_TIME", "PART_TIME"]).optional().catch(undefined),
  category: z.string().max(50).optional().catch(undefined),
  district: z.string().max(50).optional().catch(undefined),
  location: z.coerce.number().int().positive().optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1).default(1),
});

export type JobFilters = z.infer<typeof filtersSchema>;

export function parseJobFilters(
  searchParams: Record<string, string | string[] | undefined>,
): JobFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  return filtersSchema.parse(
    Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, first(v)])),
  );
}
