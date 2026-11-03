import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CategoryChips } from "@/components/home/CategoryChips";
import { PageHero } from "@/components/home/PageHero";
import { JobCard, OneDayCard } from "@/components/JobCard";
import { JobFilters } from "@/components/JobFilters";
import { JobGridSkeleton, SearchSkeleton } from "@/components/Skeletons";
import { buttonClass } from "@/components/ui";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { filtersHref, hasActiveFilters, parseJobFilters } from "@/lib/filters";
import { t } from "@/lib/format";
import { getFilterOptions, getHomeStats, getUpcomingOneDayJobs, searchJobs } from "@/lib/jobs";

const NO_FILTERS = parseJobFilters({});
const LATEST_COUNT = 6;
const ONE_DAY_COUNT = 6;

export default async function HomePage({ params, searchParams }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-10">
      <PageHero>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[56px]">{dict.home.title}</h1>
        <p className="max-w-2xl text-lg text-muted">{dict.home.subtitle}</p>
        <Suspense fallback={<SearchSkeleton label={dict.home.loading} />}>
          <HeroSearch lang={lang} dict={dict} searchParams={searchParams} />
        </Suspense>
      </PageHero>

      {/* One-day jobs are the site's main offer, so they come first */}
      <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
        <OneDayJobs lang={lang} dict={dict} />
      </Suspense>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold">{dict.home.categories}</h2>
        <CategoryChips lang={lang} dict={dict} filters={NO_FILTERS} />
      </section>

      <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
        <LatestJobs lang={lang} dict={dict} />
      </Suspense>
    </div>
  );
}

async function HeroSearch({ lang, dict, searchParams }: { lang: Locale; dict: Dictionary; searchParams: PageProps<"/[lang]">["searchParams"] }) {
  // Search results used to live on the home page; old shared links like /az?district=sheki move to the jobs page
  const filters = parseJobFilters(await searchParams);
  if (hasActiveFilters(filters)) redirect(filtersHref(lang, filters, { page: filters.page }));

  const [[categories, districts], stats] = await Promise.all([getFilterOptions(), getHomeStats()]);
  return (
    <div className="max-w-4xl space-y-3">
      <JobFilters lang={lang} dict={dict} filters={NO_FILTERS} categories={categories} districts={districts} />
      <p className="text-sm text-muted">
        {t(dict.home.stats, { jobs: stats.active })} ·{" "}
        <Link href={filtersHref(lang, {}, { type: "ONE_DAY" })} className="font-semibold text-brand hover:underline">
          {t(dict.home.statsOneDay, { count: stats.oneDayThisWeek })}
        </Link>
      </p>
    </div>
  );
}

const heading = "font-heading text-2xl font-bold";
const seeAll = "inline-flex items-center gap-1 font-semibold text-brand hover:underline";

async function OneDayJobs({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const oneDay = await getUpcomingOneDayJobs(ONE_DAY_COUNT);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={heading}>{dict.home.oneDayTitle}</h2>
        <Link href={filtersHref(lang, {}, { type: "ONE_DAY" })} className={seeAll}>
          {dict.home.seeAll}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      {oneDay.length === 0 ? (
        // Kept on the page even when empty: employers see where their one-day job would appear
        <div className="rounded-2xl border border-dashed border-line-strong p-8 text-center">
          <p className="text-muted">{dict.home.oneDayEmpty}</p>
          <Link href={`/${lang}/jobs/new`} className={`${buttonClass.secondary} mt-4`}>
            {dict.home.oneDayPost}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {oneDay.map((job) => (
            <OneDayCard key={job.id} job={job} lang={lang} dict={dict} />
          ))}
        </ul>
      )}
    </section>
  );
}

async function LatestJobs({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  // One-day jobs have their own section above, so the latest list shows the other kinds
  const { jobs } = await searchJobs(NO_FILTERS, { excludeOneDay: true });
  const now = new Date();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={heading}>{dict.home.latest}</h2>
        <Link href={`/${lang}/jobs`} className={seeAll}>
          {dict.home.allJobs}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      {jobs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-muted">{dict.home.noResults}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.slice(0, LATEST_COUNT).map((job) => (
            <JobCard key={job.id} job={job} lang={lang} dict={dict} now={now} />
          ))}
        </ul>
      )}
      <div className="flex justify-center pt-2">
        <Link href={`/${lang}/jobs`} className={buttonClass.secondary}>
          {dict.home.allJobs}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
