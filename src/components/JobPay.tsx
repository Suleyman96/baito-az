import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { site } from "@/config/site";
import { formatSalary, formatWorkStart, t } from "@/lib/format";

type PayFields = { salaryMin: number | null; salaryMax: number | null; payPeriod: "MONTH" | "DAY" | "HOUR" | "JOB" };

/** "400–600 AZN / ay", "40 AZN · bütün iş üçün", "8 AZN / saat" or "Razılaşma yolu ilə". */
export function JobPay({ job, dict, unitClassName = "text-muted" }: { job: PayFields; dict: Dictionary; unitClassName?: string }) {
  // A single non-monthly amount (one-day pay, or an hourly rate without a range) is exact, not a "from" lower bound
  const single = job.payPeriod !== "MONTH" && job.salaryMin && !job.salaryMax;
  const amount = single ? `${job.salaryMin} ${site.currency}` : formatSalary(job.salaryMin, job.salaryMax, dict.job);
  return (
    <>
      {amount}
      {(job.salaryMin || job.salaryMax) && <span className={unitClassName}> {dict.job.per[job.payPeriod]}</span>}
    </>
  );
}

type WorkFields = { workStart: Date | null; durationHours: number | null; workersNeeded: number | null };

/** "📅 Çər, 15 oktyabr, 10:00 · 5 saat · 2 nəfər lazımdır" for one-day jobs. */
export function WorkTime({ job, lang, dict, className }: { job: WorkFields; lang: Locale; dict: Dictionary; className?: string }) {
  if (!job.workStart) return null;
  const parts = [formatWorkStart(job.workStart, lang)];
  if (job.durationHours) parts.push(t(dict.job.hours, { hours: job.durationHours }));
  if (job.workersNeeded && job.workersNeeded > 1) parts.push(t(dict.job.workers, { count: job.workersNeeded }));
  return (
    <p className={className}>
      <span aria-hidden>📅 </span>
      <time dateTime={job.workStart.toISOString()}>{parts.join(" · ")}</time>
    </p>
  );
}
