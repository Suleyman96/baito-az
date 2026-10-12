import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { Avatar } from "@/components/Avatar";
import { JobGallery } from "@/components/JobGallery";
import { JobPay, WorkTime } from "@/components/JobPay";
import { CompanyLocation } from "@/components/maps/CompanyLocation";
import { formatPlace, formatRelativeDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth/session";
import { ApplyPanel } from "@/components/ApplyPanel";
import { resumeRequired } from "@/lib/applications";
import { getCurrentResume, getMyApplication } from "@/lib/application-queries";
import { t } from "@/lib/format";
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
  const phone = job.contactPhone ?? job.company.phone;

  return (
    <article className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4 rounded-xl border border-line bg-surface p-5">
        <JobGallery images={job.images} title={job.title} label={dict.upload.gallery} />
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
          <JobPay job={job} dict={dict} unitClassName="text-base font-normal text-muted" />
        </p>
        <WorkTime job={job} lang={lang} dict={dict} className="mt-2 font-medium text-accent" />
        <h2 className="mt-6 font-semibold">{dict.job.description}</h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed">{job.description}</p>
      </div>

      <aside className="h-fit space-y-3 rounded-xl border border-line bg-surface p-5">
        <div>
          <p className="text-sm text-muted">{dict.job.employer}</p>
          <Link href={`/${lang}/companies/${job.company.id}`} className="mt-1 flex items-center gap-3 font-semibold hover:text-brand">
            <Avatar name={job.company.name} imageId={job.company.owner.avatarId} size="md" />
            {job.company.name}
          </Link>
          {job.company.description && <p className="mt-2 whitespace-pre-line text-sm text-muted">{job.company.description}</p>}
        </div>
        <CompanyLocation place={job.company} dict={dict} />
        {phone && (
          <div>
            <p className="text-sm text-muted">{dict.job.phone}</p>
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="font-medium text-brand hover:underline">
              {phone}
            </a>
          </div>
        )}
        {/* Applying needs an account; after logging in the user comes back to this job */}
        <Suspense>
          <ApplySection lang={lang} dict={dict} job={job} user={user} />
        </Suspense>
      </aside>
    </article>
  );
}

async function ApplySection({
  lang,
  dict,
  job,
  user,
}: {
  lang: Locale;
  dict: Dictionary;
  job: { id: string; employmentType: "FULL_TIME" | "PART_TIME" | "ONE_DAY" };
  user: Awaited<ReturnType<typeof getCurrentUser>>;
}) {
  const a = dict.apply;
  if (!user) {
    return (
      <Link
        href={`/${lang}/login?next=${encodeURIComponent(`/${lang}/jobs/${job.id}`)}`}
        className="block w-full rounded-xl bg-brand px-4 py-2.5 text-center font-semibold text-on-brand hover:bg-brand-strong"
      >
        {dict.auth.loginToApply}
      </Link>
    );
  }
  if (user.role !== "SEEKER") return <p className="text-sm text-muted">{a.employerNote}</p>;

  const [application, resume] = await Promise.all([getMyApplication(job.id, user.id), getCurrentResume(user.id)]);
  // Coming back to a job they applied to: show where it stands instead of the form
  if (application) {
    const date = new Intl.DateTimeFormat(lang, { timeZone: "Asia/Baku", dateStyle: "medium" }).format(application.createdAt);
    return (
      <div className="space-y-2 rounded-xl bg-brand-soft p-3 text-sm text-brand-strong">
        <p className="font-semibold">{a.already}</p>
        <p>
          {t(a.appliedOn, { date })} · <span className="font-semibold">{dict.applications.seekerStatus[application.status]}</span>
        </p>
        <Link href={`/${lang}/my/applications`} className="inline-block font-semibold underline-offset-4 hover:underline">
          {a.seeAll}
        </Link>
      </div>
    );
  }
  return <ApplyPanel lang={lang} dict={dict} jobId={job.id} resumeFile={resume?.fileName ?? null} resumeRequired={resumeRequired(job.employmentType)} />;
}
