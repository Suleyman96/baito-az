import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatPlace, formatRelativeDate, formatSalary } from "@/lib/format";
import type { searchJobs } from "@/lib/jobs";

type Job = Awaited<ReturnType<typeof searchJobs>>["jobs"][number];

export function JobCard({ job, lang, dict, now }: { job: Job; lang: Locale; dict: Dictionary; now: Date }) {
  const category = dict.categories[job.category.slug as keyof Dictionary["categories"]];

  return (
    <li>
      <Link
        href={`/${lang}/jobs/${job.id}`}
        className="block rounded-xl border border-line bg-surface p-4 transition hover:border-brand hover:shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-lg leading-snug">{job.title}</h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              job.employmentType === "PART_TIME" ? "bg-accent-soft text-accent" : "bg-brand-soft text-brand"
            }`}
          >
            {dict.jobType[job.employmentType]}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {job.company.name} · {formatPlace(job.location, dict)}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            {formatSalary(job.salaryMin, job.salaryMax, dict.job)}
            {(job.salaryMin || job.salaryMax) && <span className="text-muted"> {dict.job.perMonth}</span>}
          </span>
          <span className="text-muted">
            {category} · {formatRelativeDate(job.createdAt, lang, now)}
          </span>
        </div>
      </Link>
    </li>
  );
}
