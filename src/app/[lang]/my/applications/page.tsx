import { FileText, Mail } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ApplicationStatusBadge } from "@/components/ApplicationStatusBadge";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { JobGridSkeleton } from "@/components/Skeletons";
import { buttonClass, inputClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getEmployerApplications, getSeekerApplications } from "@/lib/application-queries";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mailer } from "@/lib/mailer";
import { t } from "@/lib/format";

type SearchParams = PageProps<"/[lang]/my/applications">["searchParams"];

export default async function ApplicationsPage({ searchParams }: PageProps<"/[lang]/my/applications">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
      <Applications lang={lang} dict={dict} searchParams={searchParams} />
    </Suspense>
  );
}

async function Applications({ lang, dict, searchParams }: { lang: Locale; dict: Dictionary; searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/my/applications`)}`);
  if (user.role === "SEEKER") return <SeekerApplications lang={lang} dict={dict} userId={user.id} />;
  if (user.role === "EMPLOYER") return <EmployerApplications lang={lang} dict={dict} userId={user.id} searchParams={searchParams} />;
  redirect(`/${lang}/admin`);
}

const date = (lang: Locale, d: Date) => new Intl.DateTimeFormat(lang, { timeZone: "Asia/Baku", dateStyle: "medium" }).format(d);
const empty = "rounded-2xl border border-dashed border-line-strong p-10 text-center";

async function SeekerApplications({ lang, dict, userId }: { lang: Locale; dict: Dictionary; userId: string }) {
  const a = dict.applications;
  const applications = await getSeekerApplications(userId);

  return (
    <div className="space-y-6">
      <PageHeader title={a.titleSeeker} />
      {applications.length === 0 ? (
        <div className={empty}>
          <p className="text-muted">{a.emptySeeker}</p>
          <Link href={`/${lang}/jobs`} className={`${buttonClass.primary} mt-4`}>
            {a.browse}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {applications.map((app) => (
            <li key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
              <div className="min-w-0">
                {app.job.status === "ACTIVE" ? (
                  <Link href={`/${lang}/jobs/${app.job.id}`} className="font-heading text-lg font-bold hover:text-accent">
                    {app.job.title}
                  </Link>
                ) : (
                  <p className="font-heading text-lg font-bold">
                    {app.job.title} <span className="text-sm font-normal text-muted">· {a.jobClosed}</span>
                  </p>
                )}
                <p className="text-sm text-muted">
                  {app.job.company.name} · {t(a.appliedOn, { date: date(lang, app.createdAt) })}
                  {app.resume && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <FileText className="size-3.5" aria-hidden />
                      {app.resume.fileName}
                    </span>
                  )}
                </p>
              </div>
              <ApplicationStatusBadge status={app.status} label={a.seekerStatus[app.status]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function EmployerApplications({ lang, dict, userId, searchParams }: { lang: Locale; dict: Dictionary; userId: string; searchParams: SearchParams }) {
  const a = dict.applications;
  const { job } = await searchParams;
  const jobId = typeof job === "string" && job ? job : undefined;
  const [applications, jobs] = await Promise.all([
    getEmployerApplications(userId, jobId),
    db.job.findMany({ where: { company: { ownerId: userId } }, orderBy: { createdAt: "desc" }, select: { id: true, title: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={a.titleEmployer} subtitle={a.subtitleEmployer} />
      {!mailer.configured && (
        <p className="flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-sm text-muted">
          <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
          {a.emailOff}
        </p>
      )}
      {jobs.length > 1 && (
        <form action={`/${lang}/my/applications`} className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 space-y-1.5 sm:max-w-md">
            <span className="text-sm font-semibold">{a.filterJob}</span>
            <select name="job" defaultValue={jobId ?? ""} className={inputClass}>
              <option value="">{a.allJobs}</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={buttonClass.secondary}>
            {a.filter}
          </button>
        </form>
      )}
      {applications.length === 0 ? (
        <p className={`${empty} text-muted`}>{a.emptyEmployer}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {applications.map((app) => {
            const unseen = !app.notification?.readAt;
            return (
              <li key={app.id}>
                <Link href={`/${lang}/my/applications/${app.id}`} className={`flex flex-wrap items-center gap-3 p-4 hover:bg-surface-2 ${unseen ? "bg-accent-tint" : ""}`}>
                  <Avatar name={app.user.name} imageId={app.user.avatarId} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 font-semibold">
                      {app.user.name}
                      {unseen && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-on-brand">{a.new}</span>}
                    </span>
                    <span className="block truncate text-sm text-muted">
                      {app.job.title} · {date(lang, app.createdAt)}
                      {app.resumeId && " · CV"}
                    </span>
                  </span>
                  <ApplicationStatusBadge status={app.status} label={a.status[app.status]} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
