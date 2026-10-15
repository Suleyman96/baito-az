import { Briefcase, CalendarCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { professionName } from "@/config/professions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { districtName, t } from "@/lib/format";
import type { searchWorkers } from "@/lib/worker-directory";
import { Avatar } from "../Avatar";
import { RatingSummary } from "../reviews/RatingSummary";

type Worker = Awaited<ReturnType<typeof searchWorkers>>["workers"][number];

/** "300 AZN / ay", or "Negotiable" when no amount is given. */
export function expectedPayText(w: { expectedPay: number | null; expectedPayPeriod: "MONTH" | "DAY" | "HOUR" | "JOB" }, dict: Dictionary) {
  return w.expectedPay ? `${w.expectedPay} AZN ${dict.job.per[w.expectedPayPeriod]}` : dict.workers.negotiable;
}

/** "Available now" or "From 1 Nov", plus weekdays / weekends. */
export function availabilityText(w: { availableFrom: Date | null; availableWeekdays: boolean; availableWeekends: boolean }, lang: Locale, dict: Dictionary, now = new Date()) {
  const when =
    !w.availableFrom || w.availableFrom <= now
      ? dict.workers.availableNow
      : t(dict.workers.availableFrom, { date: new Intl.DateTimeFormat(lang, { timeZone: "Asia/Baku", day: "numeric", month: "short" }).format(w.availableFrom) });
  const days = [w.availableWeekdays && dict.workers.availWeekdays, w.availableWeekends && dict.workers.availWeekends].filter(Boolean).join(", ");
  return days ? `${when} · ${days}` : when;
}

/** Approximate place: village and district, never an address. */
export function placeText(w: { district: string; location: { name: string } | null }, dict: Dictionary) {
  const district = districtName(dict, w.district);
  return w.location && !w.location.name.startsWith(district) ? `${w.location.name}, ${district}` : district;
}

export function WorkerCard({ worker, lang, dict }: { worker: Worker; lang: Locale; dict: Dictionary }) {
  const w = dict.workers;
  return (
    <li>
      <Link
        href={`/${lang}/workers/${worker.user.id}`}
        className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-[0_4px_14px_rgba(23,32,51,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(23,32,51,0.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/25"
      >
        <span className="flex items-center gap-3">
          <Avatar name={worker.user.name} imageId={worker.user.avatarId} size="md" />
          <span className="min-w-0">
            <span className="block truncate font-heading text-lg font-bold group-hover:text-accent">{worker.user.name}</span>
            <span className="block truncate text-sm font-semibold text-brand">{professionName(worker.primaryProfession, lang)}</span>
          </span>
        </span>
        <RatingSummary summary={worker.rating} dict={dict} />
        <span className="space-y-1.5 text-sm text-muted">
          <span className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {placeText(worker, dict)}
          </span>
          <span className="flex items-center gap-2">
            <Briefcase className="size-4 shrink-0" aria-hidden />
            {[worker.experienceYears ? t(w.experience, { years: worker.experienceYears }) : null, worker.completedJobs ? t(w.completedJobs, { count: worker.completedJobs }) : null]
              .filter(Boolean)
              .join(" · ") || "—"}
          </span>
          <span className="flex items-center gap-2">
            <CalendarCheck className="size-4 shrink-0" aria-hidden />
            {availabilityText(worker, lang, dict)}
          </span>
        </span>
        <span className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-line pt-3">
          <span className="font-bold">{expectedPayText(worker, dict)}</span>
          <span className="flex flex-wrap gap-1">
            {worker.workTypes.map((type) => (
              <span key={type} className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-strong">
                {dict.jobType[type]}
              </span>
            ))}
          </span>
        </span>
        <span className="text-right text-xs font-semibold text-accent group-hover:underline">{w.viewProfile} →</span>
      </Link>
    </li>
  );
}
