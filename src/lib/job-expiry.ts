// How long a job stays listed, in Baku time. No database here, so it is unit-tested.
//
// Full-time / part-time: one calendar month from publication (approval or reactivation); the employer
// cannot change it. One-day: until the end of the end date the employer picked, or by default of the
// third day after the work date. The returned expiresAt is the first moment the job is no longer listed.

// Azerbaijan has no daylight saving time, so Baku is always UTC+4
const BAKU_OFFSET_MS = 4 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Days after the work date a one-day listing stays by default */
export const ONE_DAY_DEFAULT_EXTRA_DAYS = 3;
/** The latest end date an employer can pick, in days after the work date */
export const ONE_DAY_MAX_EXTRA_DAYS = 30;

/** "2026-11-08": the Baku calendar date of a moment */
export function bakuDate(moment: Date): string {
  return new Date(moment.getTime() + BAKU_OFFSET_MS).toISOString().slice(0, 10);
}

/** Midnight at the start of a Baku date ("2026-11-08" → 2026-11-07T20:00Z) */
function bakuMidnight(date: string): Date {
  return new Date(`${date}T00:00:00+04:00`);
}

const addDays = (date: string, days: number) => bakuDate(new Date(bakuMidnight(date).getTime() + days * DAY_MS));

/**
 * One calendar month later, on the Baku calendar and clock. A day the next month does not have
 * becomes its last day (31 January → 28/29 February).
 */
export function addMonthBaku(moment: Date): Date {
  const local = new Date(moment.getTime() + BAKU_OFFSET_MS);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  local.setUTCFullYear(year, month, Math.min(local.getUTCDate(), lastDay));
  return new Date(local.getTime() - BAKU_OFFSET_MS);
}

/** End of a full-time / part-time listing published at `publishedAt` */
export const monthlyExpiry = (publishedAt: Date) => addMonthBaku(publishedAt);

/** The last listed day of a one-day job: the picked end date, or the work date plus the default */
export function oneDayEndDate(workStart: Date, endDate: string | null): string {
  return endDate ?? addDays(bakuDate(workStart), ONE_DAY_DEFAULT_EXTRA_DAYS);
}

/** End of a one-day listing: midnight after its last day */
export function oneDayExpiry(workStart: Date, endDate: string | null): Date {
  return bakuMidnight(addDays(oneDayEndDate(workStart, endDate), 1));
}

export type EndDateError = "endDateInvalid" | "endDateInPast" | "endDateBeforeWork" | "endDateTooFar";

/**
 * Checks an end date typed in the form ("" = use the default). It may not be in the past or before the
 * work date (the listing would close before the work), and may be at most ONE_DAY_MAX_EXTRA_DAYS after it.
 */
export function checkEndDate(input: string, workStart: Date, now: Date): { endDate: string | null } | { error: EndDateError } {
  const value = input.trim();
  if (value === "") return { endDate: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || bakuDate(bakuMidnight(value)) !== value) return { error: "endDateInvalid" };
  if (value < bakuDate(now)) return { error: "endDateInPast" };
  if (value < bakuDate(workStart)) return { error: "endDateBeforeWork" };
  if (value > addDays(bakuDate(workStart), ONE_DAY_MAX_EXTRA_DAYS)) return { error: "endDateTooFar" };
  return { endDate: value };
}

/** The last listed day of a job, for showing ("active until …"): the day before expiresAt, in Baku */
export const lastListedDay = (expiresAt: Date) => bakuDate(new Date(expiresAt.getTime() - 1));
