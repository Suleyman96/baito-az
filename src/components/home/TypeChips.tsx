import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { filtersHref, type JobFilters } from "@/lib/filters";

// One-day jobs first: they are the site's main offer
const TYPES = ["ONE_DAY", "PART_TIME", "FULL_TIME"] as const;

/** One-tap job type filter, so "one-day" is found without opening the extra filters */
export function TypeChips({ lang, dict, filters }: { lang: Locale; dict: Dictionary; filters: JobFilters }) {
  const chips = [{ type: undefined, label: dict.jobsPage.typeAll }, ...TYPES.map((type) => ({ type, label: dict.jobType[type] }))];
  return (
    <nav aria-label={dict.home.allTypes}>
      <ul className="flex flex-wrap gap-2">
        {chips.map(({ type, label }) => {
          const active = filters.type === type;
          return (
            <li key={type ?? "all"}>
              <Link
                href={filtersHref(lang, filters, { type })}
                aria-current={active ? "true" : undefined}
                className={`block whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                  active ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-surface hover:border-accent"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
