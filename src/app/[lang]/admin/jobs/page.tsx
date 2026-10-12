import Link from "next/link";
import { Suspense } from "react";
import { JobPay, WorkTime } from "@/components/JobPay";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { ADMIN_JOB_TABS, getAdminJobs, parseAdminJobsQuery, type AdminJobTab } from "@/lib/admin";
import { requireAdminPage } from "@/lib/admin-guard";
import { formatPlace, formatRelativeDate, t } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { closeJob, reviewJob } from "@/lib/job-actions";

export default async function AdminJobsPage({ searchParams }: PageProps<"/[lang]/admin/jobs">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <Suspense fallback={<p className="text-muted">{dict.home.loading}</p>}>
      <AdminJobs lang={lang} dict={dict} searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminJobs({
  lang,
  dict,
  searchParams,
}: {
  lang: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[lang]/admin/jobs">["searchParams"];
}) {
  await requireAdminPage();
  const query = parseAdminJobsQuery(await searchParams);
  const { jobs, counts } = await getAdminJobs(query);
  const a = dict.admin;
  const now = new Date();
  const tabHref = (tab: AdminJobTab) => `/${lang}/admin/jobs?tab=${tab}${query.q ? `&q=${encodeURIComponent(query.q)}` : ""}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ADMIN_JOB_TABS.map((tab) => (
          <Link
            key={tab}
            href={tabHref(tab)}
            aria-current={tab === query.tab ? "page" : undefined}
            className={`rounded-full px-3 py-1 text-sm ${
              tab === query.tab ? "bg-brand text-on-brand" : "border border-line bg-surface text-muted hover:border-brand"
            }`}
          >
            {a.tabs[tab]} <span className="opacity-75">({counts[tab]})</span>
          </Link>
        ))}
      </div>

      <form action={`/${lang}/admin/jobs`} className="flex gap-2">
        <input type="hidden" name="tab" value={query.tab} />
        <input
          type="search"
          name="q"
          defaultValue={query.q}
          placeholder={a.searchJobs}
          aria-label={a.searchJobs}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2"
        />
        <button type="submit" className="rounded-lg bg-brand px-4 py-2 font-medium text-on-brand hover:bg-brand-strong">
          {a.search}
        </button>
      </form>

      {jobs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">{query.tab === "PENDING" && !query.q ? a.empty : a.noJobs}</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => {
            const owner = job.company.owner;
            return (
              <li key={job.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  {query.tab === "ACTIVE" ? (
                    <Link href={`/${lang}/jobs/${job.id}`} className="text-lg font-semibold hover:text-brand hover:underline">
                      {job.title}
                    </Link>
                  ) : (
                    <h2 className="text-lg font-semibold">{job.title}</h2>
                  )}
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">{dict.jobType[job.employmentType]}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {dict.categories[job.category.slug as keyof Dictionary["categories"]]} · {formatPlace(job.location, dict)} ·{" "}
                  {formatRelativeDate(job.createdAt, lang, now)}
                </p>
                <WorkTime job={job} lang={lang} dict={dict} className="mt-1 text-sm text-accent" />
                <p className="mt-1 text-sm font-medium">
                  <JobPay job={job} dict={dict} />
                </p>
                {query.tab === "PENDING" && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{job.description}</p>}
                {job.images.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {job.images.map((image) => (
                      <li key={image.id}>
                        <a href={imageUrl(image.id)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-line">
                          {/* eslint-disable-next-line @next/next/no-img-element -- our own image route with long caching */}
                          <img src={imageUrl(image.id)} alt="" loading="lazy" className="size-20 object-cover" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-sm text-muted">
                  {a.postedBy}: {job.company.name}
                  {job.company.name !== owner.name && ` (${owner.name})`} · {job.contactPhone ?? owner.phone ?? owner.email}
                  {owner.blockedAt && <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{a.blockedBadge}</span>}
                </p>
                {job.status === "REJECTED" && job.rejectReason && (
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">{t(dict.myJobs.reason, { reason: job.rejectReason })}</p>
                )}

                {query.tab === "PENDING" && (
                  <form action={reviewJob} className="mt-4 space-y-2">
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="id" value={job.id} />
                    <label className="block space-y-1">
                      <span className="text-sm font-medium">{a.rejectReason}</span>
                      <input
                        name="reason"
                        maxLength={300}
                        placeholder={a.rejectReasonPlaceholder}
                        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                      />
                      <span className="block text-xs text-muted">{a.rejectReasonHint}</span>
                    </label>
                    <div className="flex gap-2">
                      <button name="decision" value="approve" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand hover:bg-brand-strong">
                        {a.approve}
                      </button>
                      <button name="decision" value="reject" className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface-2">
                        {a.reject}
                      </button>
                    </div>
                  </form>
                )}
                {query.tab === "ACTIVE" && (
                  <form action={closeJob} className="mt-3">
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="id" value={job.id} />
                    <button className="rounded-lg border border-line px-4 py-2 text-sm hover:border-red-500 hover:text-red-600">{a.close}</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {jobs.length >= 100 && <p className="text-sm text-muted">{a.limitNote}</p>}
    </div>
  );
}
