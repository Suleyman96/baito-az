import Link from "next/link";
import { Suspense } from "react";
import { JobCard } from "@/components/JobCard";
import { JobFilters } from "@/components/JobFilters";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { t } from "@/lib/format";
import { parseJobFilters, type JobFilters as Filters } from "@/lib/filters";
import { getFilterOptions, searchJobs } from "@/lib/jobs";
import { notFound } from "next/navigation";

export default async function HomePage({ params, searchParams }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.home.title}</h1>
        <p className="mt-1 text-muted">{dict.home.subtitle}</p>
      </section>
      {/* Filters and results depend on the query string, so they stream in at request time */}
      <Suspense fallback={<p className="text-muted">{dict.home.loading}</p>}>
        <JobSearch lang={lang} dict={dict} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function JobSearch({
  lang,
  dict,
  searchParams,
}: {
  lang: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[lang]">["searchParams"];
}) {
  const filters = parseJobFilters(await searchParams);
  const [[categories, districts], { jobs, total, pageCount }] = await Promise.all([
    getFilterOptions(),
    searchJobs(filters),
  ]);
  const now = new Date();

  return (
    <>
      <JobFilters lang={lang} dict={dict} filters={filters} categories={categories} districts={districts} />
      <p className="text-sm text-muted">{t(dict.home.results, { count: total })}</p>
      {jobs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">{dict.home.noResults}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} lang={lang} dict={dict} now={now} />
          ))}
        </ul>
      )}
      {pageCount > 1 && <Pagination lang={lang} dict={dict} filters={filters} pageCount={pageCount} />}
    </>
  );
}

function Pagination({ lang, dict, filters, pageCount }: { lang: Locale; dict: Dictionary; filters: Filters; pageCount: number }) {
  const href = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, page })) {
      if (value !== undefined && !(key === "page" && value === 1)) query.set(key, String(value));
    }
    const qs = query.toString();
    return `/${lang}${qs ? `?${qs}` : ""}`;
  };
  const link = "rounded-lg border border-line bg-surface px-4 py-2 text-sm hover:border-brand";

  return (
    <nav className="flex items-center justify-center gap-3">
      {filters.page > 1 && <Link href={href(filters.page - 1)} className={link}>{dict.home.prev}</Link>}
      <span className="text-sm text-muted">
        {filters.page} / {pageCount}
      </span>
      {filters.page < pageCount && <Link href={href(filters.page + 1)} className={link}>{dict.home.next}</Link>}
    </nav>
  );
}
