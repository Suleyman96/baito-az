import { ShieldCheck } from "lucide-react";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { ReviewList } from "@/components/reviews/ReviewList";
import { JobGridSkeleton } from "@/components/Skeletons";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { t } from "@/lib/format";
import { getRatingSummary, getReviewsAbout, getWorkerProfile } from "@/lib/review-queries";

/** A job seeker's public page: name, photo, rating and reviews. Contacts and CV are never shown here. */
export default async function WorkerPage({ params }: PageProps<"/[lang]/workers/[id]">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
      <Worker lang={lang} dict={dict} params={params} />
    </Suspense>
  );
}

async function Worker({ lang, dict, params }: { lang: Locale; dict: Dictionary; params: PageProps<"/[lang]/workers/[id]">["params"] }) {
  const { id } = await params;
  const worker = await getWorkerProfile(id);
  if (!worker) return <p className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-muted">{dict.reviews.notFound}</p>;
  const [summary, reviews] = await Promise.all([getRatingSummary(worker.id), getReviewsAbout(worker.id)]);
  const r = dict.reviews;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center">
        <Avatar name={worker.name} imageId={worker.avatarId} size="xl" />
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm text-muted">{r.workerTitle}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{worker.name}</h1>
          <RatingSummary summary={summary} dict={dict} size="md" />
          <p className="text-sm text-muted">
            {t(dict.applications.memberSince, { date: new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(worker.createdAt) })}
          </p>
        </div>
      </section>
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
