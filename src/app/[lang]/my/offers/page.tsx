import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { OfferReplyForm } from "@/components/offers/OfferReplyForm";
import { PageHeader } from "@/components/PageHeader";
import { JobGridSkeleton } from "@/components/Skeletons";
import { buttonClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth/session";
import { t } from "@/lib/format";
import { getReceivedOffers, getSentOffers, markOffersSeen } from "@/lib/job-offer-queries";
import type { OfferStatusValue } from "@/lib/job-offers";

export default async function OffersPage() {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
      <Offers lang={lang} dict={dict} />
    </Suspense>
  );
}

async function Offers({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/my/offers`)}`);
  if (user.role === "SEEKER") return <ReceivedOffers lang={lang} dict={dict} userId={user.id} />;
  if (user.role === "EMPLOYER") return <SentOffers lang={lang} dict={dict} userId={user.id} />;
  redirect(`/${lang}/admin`);
}

const date = (lang: Locale, d: Date) => new Intl.DateTimeFormat(lang, { timeZone: "Asia/Baku", dateStyle: "medium" }).format(d);
const empty = "rounded-2xl border border-dashed border-line-strong p-10 text-center";
const STATUS_STYLE: Record<OfferStatusValue, string> = {
  PENDING: "bg-info-soft text-info",
  ACCEPTED: "bg-success-soft text-success",
  DECLINED: "bg-surface-2 text-muted",
};

function StatusBadge({ status, dict }: { status: OfferStatusValue; dict: Dictionary }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>{dict.offers.status[status]}</span>;
}

function NewBadge({ dict }: { dict: Dictionary }) {
  return <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-on-brand">{dict.offers.new}</span>;
}

/** The job named in an offer: linked while it is open */
function JobLine({ lang, dict, job }: { lang: Locale; dict: Dictionary; job: { id: string; title: string; status: string } | null }) {
  if (!job) return <span>{dict.offers.generalOffer}</span>;
  const label = t(dict.offers.about, { title: job.title });
  return job.status === "ACTIVE" ? (
    <Link href={`/${lang}/jobs/${job.id}`} className="font-semibold text-accent hover:underline">
      {label}
    </Link>
  ) : (
    <span>{label}</span>
  );
}

async function ReceivedOffers({ lang, dict, userId }: { lang: Locale; dict: Dictionary; userId: string }) {
  const o = dict.offers;
  const offers = await getReceivedOffers(userId);
  // Read first, so offers that were new still say so on this visit
  await markOffersSeen(userId, "SEEKER");

  return (
    <div className="space-y-6">
      <PageHeader title={o.titleSeeker} subtitle={o.subtitleSeeker} />
      {offers.length === 0 ? (
        <div className={empty}>
          <p className="text-muted">{o.emptySeeker}</p>
          <Link href={`/${lang}/my/profile`} className={`${buttonClass.primary} mt-4`}>
            {o.fillProfile}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {offers.map((offer) => {
            const company = offer.employer.company;
            return (
              <li key={offer.id} className={`space-y-3 rounded-2xl border bg-surface p-4 sm:p-5 ${offer.seenAt ? "border-line" : "border-accent"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={company?.name ?? offer.employer.name} imageId={offer.employer.avatarId} size="md" />
                    <div className="min-w-0">
                      {company ? (
                        <Link href={`/${lang}/companies/${company.id}`} className="font-heading text-lg font-bold hover:text-accent">
                          {company.name}
                        </Link>
                      ) : (
                        <p className="font-heading text-lg font-bold">{offer.employer.name}</p>
                      )}
                      <p className="text-sm text-muted">
                        <JobLine lang={lang} dict={dict} job={offer.job} /> · {date(lang, offer.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!offer.seenAt && <NewBadge dict={dict} />}
                    <StatusBadge status={offer.status} dict={dict} />
                  </div>
                </div>
                <p className="whitespace-pre-line leading-relaxed">{offer.message}</p>
                {offer.status === "PENDING" ? (
                  <OfferReplyForm lang={lang} dict={dict} offerId={offer.id} />
                ) : (
                  offer.reply && (
                    <p className="rounded-xl bg-surface-2 p-3 text-sm">
                      <span className="font-semibold">{o.yourReply}:</span> <span className="whitespace-pre-line">{offer.reply}</span>
                    </p>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

async function SentOffers({ lang, dict, userId }: { lang: Locale; dict: Dictionary; userId: string }) {
  const o = dict.offers;
  const offers = await getSentOffers(userId);
  await markOffersSeen(userId, "EMPLOYER");

  return (
    <div className="space-y-6">
      <PageHeader title={o.titleEmployer} subtitle={o.subtitleEmployer} />
      {offers.length === 0 ? (
        <div className={empty}>
          <p className="text-muted">{o.emptyEmployer}</p>
          <Link href={`/${lang}/workers`} className={`${buttonClass.primary} mt-4`}>
            {o.browseWorkers}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {offers.map((offer) => {
            const newReply = offer.respondedAt && !offer.replySeenAt;
            return (
              <li key={offer.id} className={`space-y-3 rounded-2xl border bg-surface p-4 sm:p-5 ${newReply ? "border-accent" : "border-line"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={offer.worker.name} imageId={offer.worker.avatarId} size="md" />
                    <div className="min-w-0">
                      <Link href={`/${lang}/workers/${offer.worker.id}`} className="font-heading text-lg font-bold hover:text-accent">
                        {offer.worker.name}
                      </Link>
                      <p className="text-sm text-muted">
                        <JobLine lang={lang} dict={dict} job={offer.job} /> · {date(lang, offer.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {newReply && <NewBadge dict={dict} />}
                    <StatusBadge status={offer.status} dict={dict} />
                  </div>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{offer.message}</p>
                {offer.reply && (
                  <p className="rounded-xl bg-surface-2 p-3 text-sm">
                    <span className="font-semibold">{o.theirReply}:</span> <span className="whitespace-pre-line">{offer.reply}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
