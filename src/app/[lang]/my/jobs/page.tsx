import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { JobPay, WorkTime } from "@/components/JobPay";
import { ReactivateJob } from "@/components/ReactivateJob";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPlace, formatRelativeDate, t } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { closeOwnJob, completeOwnJob, reopenOwnJob } from "@/lib/job-actions";
import { bakuDate, lastListedDay } from "@/lib/job-expiry";
import { jobToFormValues } from "@/lib/job-form";
import { getJobsByOwner } from "@/lib/jobs";

const STATUS_STYLE = {
  PENDING: "bg-warning-soft text-warning",
  ACTIVE: "bg-success-soft text-success",
  CLOSED: "bg-surface-2 text-muted",
  REJECTED: "bg-error-soft text-error",
  COMPLETED: "bg-info-soft text-info",
  ARCHIVED: "bg-surface-2 text-muted",
} as const;

export default async function MyJobsPage({ searchParams }: PageProps<"/[lang]/my/jobs">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{dict.myJobs.title}</h1>
        <Link href={`/${lang}/jobs/new`} className="rounded-lg bg-brand px-4 py-2 font-medium text-on-brand hover:bg-brand-strong">
          {dict.nav.postJob}
        </Link>
      </div>
      <Suspense fallback={<p className="text-muted">{dict.home.loading}</p>}>
        <MyJobs lang={lang} dict={dict} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MyJobs({
  lang,
  dict,
  searchParams,
}: {
  lang: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[lang]/my/jobs">["searchParams"];
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/my/jobs`)}`);
  const [{ created, updated }, jobs] = await Promise.all([searchParams, getJobsByOwner(user.id)]);
  const now = new Date();
  const button = "rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent hover:text-accent";
  const today = bakuDate(now);
  const longDate = new Intl.DateTimeFormat(lang, { timeZone: "Asia/Baku", dateStyle: "long" });
  // A Baku calendar date ("2026-11-10"), shown in the page's language
  const day = (date: string) => longDate.format(new Date(`${date}T12:00:00+04:00`));

  return (
    <>
      {(created || updated) && (
        <p role="status" className="rounded-lg bg-success-soft px-4 py-3 text-success">
          ✓ {created ? dict.myJobs.created : dict.manageJob.updated}
        </p>
      )}
      {jobs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">{dict.myJobs.empty}</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => {
            const completed = job.status === "COMPLETED";
            // Past its listing period: archived, or due for the next archive run (already off the site)
            const archived = job.status === "ARCHIVED" || (job.status === "ACTIVE" && job.expiresAt !== null && job.expiresAt <= now);
            const live = job.status === "ACTIVE" && !archived;
            const emailStatus = job.archiveNotices[0]?.emailStatus;
            const title = <h2 className="font-semibold">{job.title}</h2>;
            return (
              <li key={job.id} className="flex gap-4 rounded-xl border border-line bg-surface p-4">
                {job.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element -- our own image route with long caching
                  <img src={imageUrl(job.images[0].id)} alt="" loading="lazy" className="hidden size-24 shrink-0 rounded-xl object-cover sm:block" />
                )}
                <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  {/* Only published jobs have a public page */}
                  {live ? (
                    <Link href={`/${lang}/jobs/${job.id}`} className="hover:text-accent hover:underline">
                      {title}
                    </Link>
                  ) : (
                    title
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${archived ? STATUS_STYLE.ARCHIVED : STATUS_STYLE[job.status]}`}>
                    {archived ? dict.myJobs.status.ARCHIVED : dict.myJobs.status[job.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {dict.jobType[job.employmentType]} · {formatPlace(job.location, dict)} · {formatRelativeDate(job.createdAt, lang, now)}
                </p>
                <WorkTime job={job} lang={lang} dict={dict} className="mt-1 text-sm text-accent" />
                <p className="mt-1 text-sm font-medium">
                  <JobPay job={job} lang={lang} dict={dict} />
                </p>
                {live && job.expiresAt && (
                  <p className="mt-1 text-sm text-muted">{t(dict.myJobs.activeUntil, { date: day(lastListedDay(job.expiresAt)) })}</p>
                )}
                {archived && (
                  <div className="mt-2 space-y-1 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
                    <p>{t(dict.myJobs.archivedOn, { date: day(bakuDate(job.archivedAt ?? job.expiresAt ?? now)) })}</p>
                    {/* Whether the archive email went out; an unconfigured or failed email is never shown as sent */}
                    {emailStatus && <p>{dict.myJobs.archiveEmail[emailStatus]}</p>}
                  </div>
                )}
                {job.status === "REJECTED" && job.rejectReason && (
                  <p className="mt-2 rounded-lg bg-error-soft px-3 py-2 text-sm text-error">
                    {t(dict.myJobs.reason, { reason: job.rejectReason })}
                  </p>
                )}

                {/* Applications to this job, with how many are still new */}
                <Link href={`/${lang}/my/applications?job=${job.id}`} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
                  {job.applications.length === 0
                    ? dict.applications.noApplications
                    : t(dict.applications.count, { count: job.applications.length })}
                  {job.applications.some((x) => x.status === "NEW") && (
                    <span className="rounded-full bg-info-soft px-2 py-0.5 text-xs text-info">
                      {t(dict.applications.newCount, { count: job.applications.filter((x) => x.status === "NEW").length })}
                    </span>
                  )}
                </Link>
                <div className="mt-3 flex flex-wrap gap-2">
                  {archived && (
                    <ReactivateJob
                      lang={lang}
                      jobId={job.id}
                      oneDay={job.employmentType === "ONE_DAY"}
                      today={today}
                      initial={job.employmentType === "ONE_DAY" ? pickDate(jobToFormValues(job)) : undefined}
                      dict={dict}
                      buttonClassName={`${button} border-accent text-accent`}
                    />
                  )}
                  {/* Editing sends the job back to review; an archived one is usually reactivated instead */}
                  {!completed && (
                    <Link href={`/${lang}/jobs/${job.id}/edit`} className={button}>
                      {dict.manageJob.edit}
                    </Link>
                  )}
                  <Link href={`/${lang}/jobs/new?from=${job.id}`} className={button}>
                    {dict.manageJob.duplicate}
                  </Link>
                  {live && (
                    <form action={closeOwnJob}>
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="id" value={job.id} />
                      <button className={button}>{dict.manageJob.close}</button>
                    </form>
                  )}
                  {job.status === "CLOSED" && (
                    <form action={reopenOwnJob}>
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="id" value={job.id} />
                      <button className={button} title={dict.manageJob.reopenNote}>
                        {dict.manageJob.reopen}
                      </button>
                    </form>
                  )}
                  {/* The work is done: opens reviews between the employer and the accepted workers */}
                  {(job.status === "ACTIVE" || job.status === "CLOSED" || job.status === "ARCHIVED") && (
                    <form action={completeOwnJob}>
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="id" value={job.id} />
                      <button className={button} title={dict.manageJob.completeNote}>
                        {dict.manageJob.complete}
                      </button>
                    </form>
                  )}
                  {completed && (
                    <Link href={`/${lang}/my/reviews`} className={`${button} border-accent text-accent`}>
                      {dict.applications.writeReview}
                    </Link>
                  )}
                </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

const pickDate = (values: Record<string, string>) => ({ workDate: values.workDate ?? "", startTime: values.startTime ?? "" });
