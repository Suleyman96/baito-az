import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { JobGridSkeleton } from "@/components/Skeletons";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { getCompaniesWithJobs } from "@/lib/companies";
import { getRatingSummaries } from "@/lib/review-queries";
import { districtName, t } from "@/lib/format";

export default async function CompaniesPage() {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-6">
      <PageHeader title={dict.companies.title} subtitle={dict.companies.subtitle} />
      <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
        <CompanyList lang={lang} dict={dict} />
      </Suspense>
    </div>
  );
}

async function CompanyList({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const companies = await getCompaniesWithJobs();
  const ratings = await getRatingSummaries(companies.map((c) => c.owner.id));
  if (companies.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-muted">{dict.companies.empty}</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {companies.map((c) => (
        <li key={c.id}>
          <Link
            href={`/${lang}/companies/${c.id}`}
            className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-[0_4px_14px_rgba(23,32,51,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(23,32,51,0.12)]"
          >
            <span className="flex items-center gap-3">
              <Avatar name={c.name} imageId={c.owner.avatarId} />
              <span className="min-w-0">
                <span className="block truncate font-heading text-lg font-bold group-hover:text-accent">{c.name}</span>
                <span className="text-sm font-semibold text-brand-strong">{t(dict.companies.jobCount, { count: c.jobCount })}</span>
                <span className="block">
                  <RatingSummary summary={ratings.get(c.owner.id) ?? { average: null, count: 0 }} dict={dict} />
                </span>
              </span>
            </span>
            {c.description && <span className="line-clamp-2 text-sm text-muted">{c.description}</span>}
            <span className="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-line pt-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted">
                <MapPin className="size-4" aria-hidden />
                {c.districts.map((d) => districtName(dict, d)).join(", ")}
              </span>
              <ArrowRight className="size-4 text-brand" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
