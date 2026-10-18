import Link from "next/link";
import { Suspense } from "react";
import { PageHero } from "@/components/home/PageHero";
import { PageHeader } from "@/components/PageHeader";
import { JobGridSkeleton, SearchSkeleton } from "@/components/Skeletons";
import { buttonClass } from "@/components/ui";
import { WorkerCard } from "@/components/workers/WorkerCard";
import { WorkerFilters } from "@/components/workers/WorkerFilters";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { t } from "@/lib/format";
import { searchWorkers } from "@/lib/worker-directory";
import { parseWorkerFilters, workerFiltersHref, type WorkerFilters as Filters } from "@/lib/worker-filters";

type SearchParams = PageProps<"/[lang]/workers">["searchParams"];

/** "İş axtaranlar": job seekers who chose to show their profile. */
export default async function WorkersPage({ searchParams }: PageProps<"/[lang]/workers">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-6">
      <PageHero>
        <PageHeader title={dict.workers.title} subtitle={dict.workers.subtitle} />
        <Suspense fallback={<SearchSkeleton label={dict.home.loading} />}>
          <DirectorySearchForm lang={lang} dict={dict} searchParams={searchParams} />
        </Suspense>
      </PageHero>
      <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
        <Directory lang={lang} dict={dict} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DirectorySearchForm({ lang, dict, searchParams }: { lang: Locale; dict: Dictionary; searchParams: SearchParams }) {
  return <WorkerFilters lang={lang} dict={dict} filters={parseWorkerFilters(await searchParams)} />;
}

async function Directory({ lang, dict, searchParams }: { lang: Locale; dict: Dictionary; searchParams: SearchParams }) {
  const filters = parseWorkerFilters(await searchParams);
  const { workers, total, pageCount } = await searchWorkers(filters);
  const w = dict.workers;
  const pill = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm ${active ? "bg-brand text-on-brand" : "border border-line bg-surface text-muted hover:border-accent"}`;

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold">{t(w.found, { count: total })}</h2>
          <nav aria-label={w.sortLabel} className="flex items-center gap-2">
            <span className="text-sm text-muted">{w.sortLabel}:</span>
            {(["relevance", "rating"] as const).map((sort) => (
              <Link key={sort} href={workerFiltersHref(lang, filters, { sort })} aria-current={filters.sort === sort ? "true" : undefined} className={pill(filters.sort === sort)}>
                {sort === "relevance" ? w.sortRelevance : w.sortRating}
              </Link>
            ))}
          </nav>
        </div>
        {workers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong p-10 text-center">
            <p className="text-muted">{w.empty}</p>
            <Link href={`/${lang}/workers`} className={`${buttonClass.secondary} mt-4`}>
              {dict.home.clear}
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} lang={lang} dict={dict} />
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
        <Link href={workerFiltersHref(lang, filters, { page: filters.page - 1 })} className={buttonClass.secondary}>
          {dict.home.prev}
        </Link>
      )}
      <span className="text-sm text-muted">
        {filters.page} / {pageCount}
      </span>
      {filters.page < pageCount && (
        <Link href={workerFiltersHref(lang, filters, { page: filters.page + 1 })} className={buttonClass.secondary}>
          {dict.home.next}
        </Link>
      )}
    </nav>
  );
}
