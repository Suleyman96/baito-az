import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { JobGridSkeleton } from "@/components/Skeletons";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth/session";
import { t } from "@/lib/format";
import { getPendingReviews, getRatingSummary, getReviewsAbout, getReviewsBy } from "@/lib/review-queries";

export default async function ReviewsPage() {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-8">
      <PageHeader title={dict.reviews.title} subtitle={dict.reviews.subtitle} />
      <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
        <Reviews lang={lang} dict={dict} />
      </Suspense>
    </div>
  );
}

const heading = "font-heading text-xl font-bold";

async function Reviews({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/my/reviews`)}`);
  const r = dict.reviews;
  const [pending, written, received, summary] = await Promise.all([
    getPendingReviews(user.id),
    getReviewsBy(user.id),
    getReviewsAbout(user.id),
    getRatingSummary(user.id),
  ]);

  return (
    <>
      <section className="space-y-3">
        <h2 className={heading}>{r.pendingTitle}</h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-muted">{r.pendingEmpty}</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {pending.map(({ job, subject }) => {
              const name = subject.role === "EMPLOYER" && subject.company ? subject.company.name : subject.name;
              return (
                <li key={`${job.id}-${subject.id}`} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={name} imageId={subject.avatarId} size="md" />
                    <div className="min-w-0">
                      <p className="font-semibold">{name}</p>
                      <p className="truncate text-sm text-muted">{t(r.forJob, { title: job.title })}</p>
                    </div>
                  </div>
                  <ReviewForm lang={lang} dict={dict} jobId={job.id} subjectId={subject.id} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={heading}>{r.receivedTitle}</h2>
          <RatingSummary summary={summary} dict={dict} />
        </div>
        <ReviewList lang={lang} dict={dict} empty={r.noReviews} reviews={received.map((x) => ({ ...x, person: x.author }))} />
      </section>

      <section className="space-y-3">
        <h2 className={heading}>{r.writtenTitle}</h2>
        <ReviewList lang={lang} dict={dict} empty={r.writtenEmpty} reviews={written.map((x) => ({ ...x, person: x.subject }))} />
      </section>
    </>
  );
}
