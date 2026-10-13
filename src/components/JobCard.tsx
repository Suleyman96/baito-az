import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatPlace, formatRelativeDate, t } from "@/lib/format";
import type { searchJobs } from "@/lib/jobs";
import { imageUrl } from "@/lib/images";
import { Avatar } from "./Avatar";
import { CategoryIcon } from "./CategoryIcon";
import { JobPay } from "./JobPay";

type Job = Awaited<ReturnType<typeof searchJobs>>["jobs"][number];

// Posted within this time: shows a "New" badge
const NEW_FOR_MS = 48 * 60 * 60 * 1000;

const card =
  "group flex h-full flex-col rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(23,32,51,0.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/25";

export function JobCard({ job, lang, dict, now }: { job: Job; lang: Locale; dict: Dictionary; now: Date }) {
  if (job.employmentType === "ONE_DAY" && job.workStart) return <OneDayCard job={job} lang={lang} dict={dict} />;

  const isNew = now.getTime() - job.createdAt.getTime() < NEW_FOR_MS;
  const category = dict.categories[job.category.slug as keyof Dictionary["categories"]];
  const cover = job.images[0]?.id;

  return (
    <li>
      <Link href={`/${lang}/jobs/${job.id}`} className={`${card} gap-3 overflow-hidden border-line bg-surface shadow-[0_4px_14px_rgba(23,32,51,0.06)]`}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- our own image route with long caching
          <img src={imageUrl(cover)} alt="" loading="lazy" className="-mx-5 -mt-5 mb-1 aspect-[16/9] w-[calc(100%+2.5rem)] max-w-none object-cover" />
        )}
        <span className="flex items-start justify-between gap-2">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand" title={category}>
            <CategoryIcon slug={job.category.slug} />
          </span>
          {isNew && <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-ink">{dict.job.new}</span>}
        </span>
        <span className="font-heading text-lg font-bold leading-snug group-hover:text-accent">{job.title}</span>
        <span className="flex items-center gap-2 text-sm text-muted">
          <Avatar name={job.company.name} imageId={job.company.owner.avatarId} size="xs" />
          <span className="min-w-0">
            {job.company.name} · {formatPlace(job.location, dict)}
          </span>
        </span>
        <span className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-line pt-3">
          <span className="font-bold">
            <JobPay job={job} dict={dict} unitClassName="font-normal text-muted" />
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              job.employmentType === "FULL_TIME" ? "bg-brand-soft text-brand-strong" : "bg-accent-soft text-accent-ink"
            }`}
          >
            {dict.jobType[job.employmentType]}
          </span>
        </span>
        <span className="flex items-center justify-between gap-2 text-xs text-muted">
          {formatRelativeDate(job.createdAt, lang, now)}
          <span className="font-semibold text-accent group-hover:underline">{dict.apply.card} →</span>
        </span>
      </Link>
    </li>
  );
}

/** One-day job: a date tile ("15 OKT") up front, then time, length and pay. */
export function OneDayCard({ job, lang, dict }: { job: Job; lang: Locale; dict: Dictionary }) {
  const start = job.workStart!;
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(lang, { timeZone: "Asia/Baku", ...options }).format(start);
  const details = [
    formatPlace(job.location, dict),
    part({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
    job.durationHours ? t(dict.job.hours, { hours: job.durationHours }) : null,
    job.workersNeeded && job.workersNeeded > 1 ? t(dict.job.workersShort, { count: job.workersNeeded }) : null,
  ].filter(Boolean);

  return (
    <li>
      <Link href={`/${lang}/jobs/${job.id}`} className={`${card} flex-row items-center gap-4 border-accent-soft bg-accent-tint`}>
        <time
          dateTime={start.toISOString()}
          className="flex h-[76px] w-[72px] shrink-0 flex-col items-center justify-center rounded-2xl bg-surface shadow-[0_2px_6px_rgba(23,32,51,0.12)]"
        >
          <span className="font-heading text-[28px] font-extrabold leading-none text-accent">{part({ day: "numeric" })}</span>
          <span className="mt-1 text-xs font-bold uppercase tracking-wider text-accent-ink">{part({ month: "short" }).replace(".", "")}</span>
        </time>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="font-heading text-lg font-bold leading-snug group-hover:text-accent">{job.title}</span>
          <span className="text-sm text-muted">{details.join(" · ")}</span>
          <span className="font-bold text-brand-strong">
            <JobPay job={job} dict={dict} unitClassName="font-normal text-muted" />
          </span>
        </span>
      </Link>
    </li>
  );
}
