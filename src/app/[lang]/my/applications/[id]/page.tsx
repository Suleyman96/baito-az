import { ArrowLeft, Download, Eye, FileText, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ApplicationStatusBadge } from "@/components/ApplicationStatusBadge";
import { Avatar } from "@/components/Avatar";
import { JobGridSkeleton } from "@/components/Skeletons";
import { buttonClass, inputClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { updateApplicationStatus } from "@/lib/application-actions";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { getEmployerApplication, markApplicationSeen } from "@/lib/application-queries";
import { getRatingSummary } from "@/lib/review-queries";
import { APPLICATION_STATUSES } from "@/lib/applications";
import { getCurrentUser } from "@/lib/auth/session";
import { formatFileSize, t } from "@/lib/format";
import { resumeUrl } from "@/lib/resumes";

export default async function ApplicationPage({ params }: PageProps<"/[lang]/my/applications/[id]">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-6">
      <Link href={`/${lang}/my/applications`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        {dict.applications.back}
      </Link>
      <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
        <Application lang={lang} dict={dict} params={params} />
      </Suspense>
    </div>
  );
}

const date = (lang: Locale, d: Date) => new Intl.DateTimeFormat(lang, { timeZone: "Asia/Baku", dateStyle: "medium", timeStyle: "short" }).format(d);

async function Application({ lang, dict, params }: { lang: Locale; dict: Dictionary; params: PageProps<"/[lang]/my/applications/[id]">["params"] }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/my/applications/${id}`)}`);
  // Only the employer of the job may see an application; for everyone else it does not exist
  const app = user.role === "EMPLOYER" ? await getEmployerApplication(user.id, id) : null;
  if (!app) notFound();
  const [summary] = await Promise.all([getRatingSummary(app.user.id), markApplicationSeen(user.id, app.id)]);

  const a = dict.applications;
  const isPdf = app.resume?.mimeType === "application/pdf";

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {/* Applicant profile */}
        <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-5">
          <Avatar name={app.user.name} imageId={app.user.avatarId} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">{a.applicant}</p>
            <h1 className="text-2xl font-extrabold tracking-tight">{app.user.name}</h1>
            <p className="text-sm text-muted">{t(a.memberSince, { date: new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(app.user.createdAt) })}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <RatingSummary summary={summary} dict={dict} />
              <Link href={`/${lang}/workers/${app.user.id}`} className="text-sm font-semibold text-accent hover:underline">
                {a.viewProfile}
              </Link>
            </div>
          </div>
          <ApplicationStatusBadge status={app.status} label={a.status[app.status]} />
        </section>

        <section className="space-y-2 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-heading text-lg font-bold">{a.message}</h2>
          <p className="whitespace-pre-line leading-relaxed">{app.message ?? <span className="text-muted">{a.noMessage}</span>}</p>
        </section>

        {/* CV: shown only here, behind the same check as the file itself */}
        <section className="space-y-3 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-heading text-lg font-bold">{a.resume}</h2>
          {app.resume ? (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-2 p-3">
                <FileText className="size-5 text-brand" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {app.resume.fileName} <span className="font-normal text-muted">· {formatFileSize(app.resume.size)}</span>
                </span>
                {isPdf && (
                  <a href={resumeUrl(app.resume.id)} target="_blank" rel="noreferrer" className={buttonClass.secondary}>
                    <Eye className="size-4" aria-hidden />
                    {a.preview}
                  </a>
                )}
                <a href={resumeUrl(app.resume.id, true)} className={buttonClass.primary}>
                  <Download className="size-4" aria-hidden />
                  {a.download}
                </a>
              </div>
              {isPdf ? (
                <iframe src={resumeUrl(app.resume.id)} title={app.resume.fileName} className="h-[70vh] w-full rounded-xl border border-line bg-surface-2" />
              ) : (
                <p className="text-sm text-muted">{a.wordNote}</p>
              )}
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-line-strong p-4 text-sm text-muted">{a.noResume}</p>
          )}
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-line bg-surface p-5">
        <div>
          <p className="text-sm text-muted">{a.appliedFor}</p>
          <Link href={`/${lang}/jobs/${app.job.id}`} className="font-semibold hover:text-accent">
            {app.job.title}
          </Link>
          <p className="text-sm text-muted">{t(a.appliedOn, { date: date(lang, app.createdAt) })}</p>
        </div>
        {/* Contact details are shown to the employer this person applied to */}
        <div className="space-y-2">
          <p className="text-sm text-muted">{a.contacts}</p>
          {app.user.phone && (
            <a href={`tel:${app.user.phone}`} className="flex items-center gap-2 font-semibold hover:text-accent">
              <Phone className="size-4 text-brand" aria-hidden />
              {app.user.phone}
            </a>
          )}
          {app.user.email && (
            <a href={`mailto:${app.user.email}`} className="flex items-center gap-2 break-all font-semibold hover:text-accent">
              <Mail className="size-4 shrink-0 text-brand" aria-hidden />
              {app.user.email}
            </a>
          )}
        </div>
        <form action={updateApplicationStatus} className="space-y-2 border-t border-line pt-4">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="id" value={app.id} />
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">{a.changeStatus}</span>
            <select name="status" defaultValue={app.status} className={inputClass}>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {a.status[s]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={`${buttonClass.primary} w-full`}>
            {a.save}
          </button>
        </form>
      </aside>
    </div>
  );
}
