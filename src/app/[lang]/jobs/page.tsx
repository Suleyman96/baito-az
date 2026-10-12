import Link from "next/link";
import { Suspense } from "react";
import { ActiveFilters } from "@/components/home/ActiveFilters";
import { CategoryChips } from "@/components/home/CategoryChips";
import { JobCard } from "@/components/JobCard";
import { JobFilters } from "@/components/JobFilters";
import { PageHeader } from "@/components/PageHeader";
import { JobGridSkeleton, SearchSkeleton } from "@/components/Skeletons";
import { buttonClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { db } from "@/lib/db";
import { filtersHref, hasActiveFilters, parseJobFilters, type JobFilters as Filters } from "@/lib/filters";
import { t } from "@/lib/format";
import { getFilterOptions, searchJobs } from "@/lib/jobs";

type SearchParams = PageProps<"/[lang]/jobs">["searchParams"];

export default async function JobsPage({ searchParams }: PageProps<"/[lang]/jobs">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-6">
      <PageHeader title={dict.jobsPage.title} subtitle={dict.jobsPage.subtitle} />
      {/* Filters and results depend on the query string, so they stream in at request time */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <SearchSkeleton label={dict.home.loading} />
            <JobGridSkeleton label={dict.home.loading} />
          </div>
        }
      >
        <JobSearch lang={lang} dict={dict} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function JobSearch({ lang, dict, searchParams }: { lang: Locale; dict: Dictionary; searchParams: SearchParams }) {
  const filters = parseJobFilters(await searchParams);
  const [[categories, districts], { jobs, total, pageCount }, village] = await Promise.all([
    getFilterOptions(),
    searchJobs(filters),
    filters.location ? db.location.findUnique({ where: { id: filters.location }, select: { name: true } }) : null,
  ]);
  const now = new Date();

  return (
    <>
      <JobFilters lang={lang} dict={dict} filters={filters} categories={categories} districts={districts} />
      <CategoryChips lang={lang} dict={dict} filters={filters} />

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold">{t(dict.home.results, { count: total })}</h2>
        {hasActiveFilters(filters) && <ActiveFilters lang={lang} dict={dict} filters={filters} villageName={village?.name} />}
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong p-10 text-center">
            <p className="text-muted">{dict.home.noResults}</p>
            <Link href={`/${lang}/jobs`} className={`${buttonClass.secondary} mt-4`}>
              {dict.home.clear}
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} lang={lang} dict={dict} now={now} />
            ))}
          </ul>
        )}
        {pageCount > 1 && <Pagination lang={lang} dict={dict} filters={filters} pageCount={pageCount} />}
      </section>
    </>
  );
}

function Pagination({ lang, dict, filters, pageCount }: { lang: Locale; dict: Dictionary; filters: Filters; pageCount: number }) {
  return (
    <nav className="flex items-center justify-center gap-3 pt-2">
      {filters.page > 1 && (
        <Link href={filtersHref(lang, filters, { page: filters.page - 1 })} className={buttonClass.secondary}>
          {dict.home.prev}
        </Link>
      )}
      <span className="text-sm text-muted">
        {filters.page} / {pageCount}
      </span>
      {filters.page < pageCount && (
        <Link href={filtersHref(lang, filters, { page: filters.page + 1 })} className={buttonClass.secondary}>
          {dict.home.next}
        </Link>
      )}
    </nav>
  );
}
