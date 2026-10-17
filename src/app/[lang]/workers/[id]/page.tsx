import { Briefcase, CalendarCheck, MapPin, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { JobGallery } from "@/components/JobGallery";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { ReviewList } from "@/components/reviews/ReviewList";
import { JobGridSkeleton } from "@/components/Skeletons";
import { availabilityText, expectedPayText, placeText } from "@/components/workers/WorkerCard";
import { professionName, skillName } from "@/config/professions";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth/session";
import { districtName, t } from "@/lib/format";
import { getRatingSummary, getReviewsAbout, getWorkerProfile } from "@/lib/review-queries";
import { SocialLinksList } from "@/components/SocialLinksList";
import { getPublicWorkerProfile } from "@/lib/worker-directory";

/**
 * A job seeker's public page: name, photo, rating, reviews and, when they chose to show it, their work profile.
 * Contacts and CV are never shown here.
 */
export default async function WorkerPage({ params }: PageProps<"/[lang]/workers/[id]">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
      <Worker lang={lang} dict={dict} params={params} />
    </Suspense>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-heading text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

const chip = "rounded-full bg-surface-2 px-3 py-1 text-sm";

async function Worker({ lang, dict, params }: { lang: Locale; dict: Dictionary; params: PageProps<"/[lang]/workers/[id]">["params"] }) {
  const { id } = await params;
  const [worker, viewer] = await Promise.all([getWorkerProfile(id), getCurrentUser()]);
  if (!worker) return <p className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-muted">{dict.reviews.notFound}</p>;
  const [summary, reviews, profile] = await Promise.all([getRatingSummary(worker.id), getReviewsAbout(worker.id), getPublicWorkerProfile(worker.id, viewer?.id ?? null)]);
  const r = dict.reviews;
  const w = dict.workers;
  const isOwner = viewer?.id === worker.id;

  return (
    <div className="space-y-6">
      {isOwner && (!profile || !profile.visible) && (
        <p className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-2 p-3 text-sm text-muted">
          {profile ? w.hiddenNote : w.noProfileYet}
          <Link href={`/${lang}/my/profile`} className="font-semibold text-accent hover:underline">
            {w.fillProfile}
          </Link>
        </p>
      )}
      <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center">
        <Avatar name={worker.name} imageId={worker.avatarId} size="xl" />
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm text-muted">{r.workerTitle}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{worker.name}</h1>
          {profile && <p className="text-lg font-semibold text-brand">{professionName(profile.primaryProfession, lang)}</p>}
          <RatingSummary summary={summary} dict={dict} size="md" />
          <p className="text-sm text-muted">
            {t(dict.applications.memberSince, { date: new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(worker.createdAt) })}
            {profile && profile.completedJobs > 0 && ` · ${t(w.completedJobs, { count: profile.completedJobs })}`}
          </p>
          {profile && (
            <div className="pt-1">
              <SocialLinksList links={profile.social} dict={dict} />
            </div>
          )}
        </div>
      </section>

      {profile && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {profile.bio && (
              <Block title={w.about}>
                <p className="whitespace-pre-line leading-relaxed">{profile.bio}</p>
              </Block>
            )}
            <Block title={w.professions}>
              <ul className="flex flex-wrap gap-2">
                {[profile.primaryProfession, ...profile.additionalProfessions].map((p, i) => (
                  <li key={p} className={i === 0 ? "rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-strong" : chip}>
                    {professionName(p, lang)}
                  </li>
                ))}
              </ul>
              {profile.experienceYears !== null && <p className="text-sm text-muted">{t(w.experience, { years: profile.experienceYears })}</p>}
            </Block>
            {profile.skills.length > 0 && (
              <Block title={w.skills}>
                <ul className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <li key={s} className={chip}>
                      {skillName(s, lang)}
                    </li>
                  ))}
                </ul>
              </Block>
            )}
            {profile.workHistory && (
              <Block title={w.workHistory}>
                <p className="whitespace-pre-line leading-relaxed">{profile.workHistory}</p>
              </Block>
            )}
            {profile.certificates && (
              <Block title={w.certificates}>
                <p className="whitespace-pre-line leading-relaxed">{profile.certificates}</p>
              </Block>
            )}
            {profile.portfolio.length > 0 && (
              <Block title={w.portfolio}>
                <JobGallery images={profile.portfolio} title={worker.name} label={w.portfolio} />
              </Block>
            )}
          </div>

          <aside className="h-fit space-y-3 rounded-2xl border border-line bg-surface p-5 text-sm">
            <h2 className="font-heading text-lg font-bold">{w.preferences}</h2>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              {placeText(profile, dict)}
            </p>
            {profile.preferredDistricts.length > 0 && (
              <p className="text-muted">
                {w.preferredDistricts}: {profile.preferredDistricts.map((d) => districtName(dict, d)).join(", ")}
              </p>
            )}
            {profile.maxCommuteKm !== null && <p className="text-muted">{t(w.commute, { km: profile.maxCommuteKm })}</p>}
            {profile.willingToRelocate && <p className="text-muted">{w.relocate}</p>}
            <p className="flex items-start gap-2">
              <Briefcase className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              {profile.workTypes.map((type) => dict.jobType[type]).join(", ")} · {dict.workerProfile.workplaceOptions[profile.workplace]}
            </p>
            <p className="flex items-start gap-2">
              <CalendarCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              {availabilityText(profile, lang, dict)}
            </p>
            <p className="flex items-start gap-2 font-semibold">
              <Wallet className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              {expectedPayText(profile, dict)}
            </p>
            {profile.ageRange && (
              <p className="text-muted">
                {w.age}: {profile.ageRange}
              </p>
            )}
          </aside>
        </div>
      )}

      <p className="flex items-start gap-2 text-sm text-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {r.privacyNote}
      </p>
      <section className="space-y-3">
        <h2 className="font-heading text-2xl font-bold">{r.title}</h2>
        <ReviewList lang={lang} dict={dict} empty={r.noReviews} reviews={reviews.map((x) => ({ ...x, person: x.author }))} />
      </section>
    </div>
  );
}
