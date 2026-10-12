import { ArrowLeft, Phone } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { CompanyLocation } from "@/components/maps/CompanyLocation";
import { JobCard } from "@/components/JobCard";
import { JobGridSkeleton } from "@/components/Skeletons";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getCompany } from "@/lib/companies";
import { t } from "@/lib/format";

export default async function CompanyPage({ params }: PageProps<"/[lang]/companies/[id]">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-6">
      <Link href={`/${lang}/companies`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        {dict.companies.back}
      </Link>
      <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
        <Company lang={lang} dict={dict} params={params} />
      </Suspense>
    </div>
  );
}

async function Company({ lang, dict, params }: { lang: Locale; dict: Dictionary; params: PageProps<"/[lang]/companies/[id]">["params"] }) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) {
    return <p className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-muted">{dict.companies.notFound}</p>;
  }
  const now = new Date();

  return (
    <>
      <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-start">
        <Avatar name={company.name} imageId={company.owner.avatarId} size="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">{company.name}</h1>
          <p className="font-semibold text-brand-strong">{t(dict.companies.jobCount, { count: company.jobs.length })}</p>
          <h2 className="pt-2 text-sm font-semibold uppercase tracking-wider text-muted">{dict.companies.about}</h2>
          <p className="whitespace-pre-line leading-relaxed">{company.description ?? <span className="text-muted">{dict.companies.noDescription}</span>}</p>
          {(company.address || company.latitude !== null) && (
            <h2 className="pt-2 text-sm font-semibold uppercase tracking-wider text-muted">{dict.companies.location}</h2>
          )}
          <CompanyLocation place={company} dict={dict} />
        </div>
        {company.phone && (
          <a
            href={`tel:${company.phone.replace(/\s/g, "")}`}
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-line-strong px-4 py-2 font-semibold hover:border-brand hover:text-brand"
          >
            <Phone className="size-4" aria-hidden />
            {company.phone}
          </a>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold">{dict.companies.openJobs}</h2>
        {company.jobs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-muted">{dict.companies.noJobs}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {company.jobs.map((job) => (
              <JobCard key={job.id} job={job} lang={lang} dict={dict} now={now} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
