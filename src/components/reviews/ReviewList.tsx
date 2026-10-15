import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Avatar } from "../Avatar";
import { Stars } from "./Stars";

type Person = { id: string; name: string; avatarId: string | null; role: string; company: { id: string; name: string } | null };
type Review = { id: string; rating: number; comment: string; createdAt: Date; job: { title: string }; person: Person };

/** Where a person's public page is: the company page for employers, the worker page for job seekers. */
export function profileHref(lang: Locale, person: Person) {
  if (person.role === "EMPLOYER" && person.company) return `/${lang}/companies/${person.company.id}`;
  if (person.role === "SEEKER") return `/${lang}/workers/${person.id}`;
  return null;
}

/** Reviews with the other person (who wrote it, or who it is about), stars, date, job and comment. */
export function ReviewList({ reviews, lang, dict, empty }: { reviews: Review[]; lang: Locale; dict: Dictionary; empty: string }) {
  if (reviews.length === 0) return <p className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-muted">{empty}</p>;
  const date = new Intl.DateTimeFormat(lang, { timeZone: "Asia/Baku", dateStyle: "medium" });

  return (
    <ul className="space-y-3">
      {reviews.map((r) => {
        const href = profileHref(lang, r.person);
        const name = r.person.role === "EMPLOYER" && r.person.company ? r.person.company.name : r.person.name;
        return (
          <li key={r.id} className="space-y-2 rounded-2xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={name} imageId={r.person.avatarId} size="sm" />
              <div className="min-w-0 flex-1">
                {href ? (
                  <Link href={href} className="font-semibold hover:text-accent">
                    {name}
                  </Link>
                ) : (
                  <span className="font-semibold">{name}</span>
                )}
                <p className="truncate text-xs text-muted">
                  {r.person.role === "EMPLOYER" ? dict.reviews.employer : dict.reviews.worker} · {r.job.title}
                </p>
              </div>
              <div className="text-right">
                <Stars rating={r.rating} />
                <p className="text-xs text-muted">
                  <time dateTime={r.createdAt.toISOString()}>{date.format(r.createdAt)}</time>
                </p>
              </div>
            </div>
            <p className="whitespace-pre-line leading-relaxed">{r.comment}</p>
          </li>
        );
      })}
    </ul>
  );
}
