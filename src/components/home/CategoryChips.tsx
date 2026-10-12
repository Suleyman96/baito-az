import Link from "next/link";
import { site } from "@/config/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { filtersHref, type JobFilters } from "@/lib/filters";
import { CategoryIcon } from "../CategoryIcon";

/** One-tap category filters. Tapping the active one removes it. */
export function CategoryChips({ lang, dict, filters }: { lang: Locale; dict: Dictionary; filters: JobFilters }) {
  return (
    <nav aria-label={dict.home.categories} className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {site.categories.map((slug) => {
          const active = filters.category === slug;
          return (
            <li key={slug}>
              <Link
                href={filtersHref(lang, filters, { category: active ? undefined : slug })}
                aria-current={active ? "true" : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
                  active ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-surface hover:border-brand"
                }`}
              >
                <CategoryIcon slug={slug} className="size-[18px] text-brand" />
                {dict.categories[slug]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
