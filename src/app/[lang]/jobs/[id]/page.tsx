import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { formatPlace, formatRelativeDate, formatSalary } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveJob } from "@/lib/jobs";

export default async function JobPage({ params }: PageProps<"/[lang]/jobs/[id]">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-4">
      <Link href={`/${lang}`} className="text-sm text-brand hover:underline">
        ← {dict.job.back}
      </Link>
      <Suspense fallback={<p className="text-muted">{dict.home.loading}</p>}>
        <JobDetail lang={lang} dict={dict} params={params} />
      </Suspense>
    </div>
  );
}

async function JobDetail({
  lang,
  dict,
  params,
}: {
  lang: Locale;
  dict: Dictionary;
  params: PageProps<"/[lang]/jobs/[id]">["params"];
}) {
  const { id } = await params;
  const [job, user] = await Promise.all([getActiveJob(id), getCurrentUser()]);
  if (!job) {
    return <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">{dict.job.notFound}</p>;
  }
  const category = dict.categories[job.category.slug as keyof Dictionary["categories"]];

  return (
    <article className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-medium text-brand">
            {dict.jobType[job.employmentType]}
          </span>
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-muted">{category}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold">{job.title}</h1>
        <p className="mt-1 text-muted">
          {formatPlace(job.location, dict)} · {formatRelativeDate(job.createdAt, lang)}
        </p>
        <p className="mt-4 text-xl font-semibold">
          {formatSalary(job.salaryMin, job.salaryMax, dict.job)}
          {(job.salaryMin || job.salaryMax) && <span className="text-base font-normal text-muted"> {dict.job.perMonth}</span>}
        </p>
        <h2 className="mt-6 font-semibold">{dict.job.description}</h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed">{job.description}</p>
      </div>

      <aside className="h-fit space-y-3 rounded-xl border border-line bg-surface p-5">
        <div>
          <p className="text-sm text-muted">{dict.job.employer}</p>
          <p className="font-semibold">{job.company.name}</p>
        </div>
        {job.company.phone && (
          <div>
            <p className="text-sm text-muted">{dict.job.phone}</p>
            <a href={`tel:${job.company.phone.replace(/\s/g, "")}`} className="font-medium text-brand hover:underline">
              {job.company.phone}
            </a>
          </div>
        )}
        {/* Applying needs an account; after logging in the user comes back to this job */}
        {!user ? (
          <Link
            href={`/${lang}/login?next=${encodeURIComponent(`/${lang}/jobs/${job.id}`)}`}
            className="block w-full rounded-lg bg-brand px-4 py-2 text-center font-medium text-white hover:bg-brand-strong"
          >
            {dict.auth.loginToApply}
          </Link>
        ) : user.role === "SEEKER" ? (
          <>
            <button disabled className="w-full cursor-not-allowed rounded-lg bg-brand px-4 py-2 font-medium text-white opacity-60">
              {dict.job.apply}
            </button>
            <p className="text-xs text-muted">{dict.job.applySoon}</p>
          </>
        ) : null}
      </aside>
    </article>
  );
}
