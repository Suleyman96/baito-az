import { Search, SlidersHorizontal } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { JobFilters as Filters } from "@/lib/filters";
import { districtName } from "@/lib/format";
import { LocationSelect } from "./LocationSelect";
import { buttonClass } from "./ui";

type Category = { id: number; slug: string };
type District = { id: number; slug: string };
type Place = { id: number; name: string };

// Softer fields for the warm search card (no border, sand fill)
const field = "w-full rounded-xl border border-transparent bg-surface-2 px-3.5 py-3 text-base outline-none transition focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/15";

// Plain GET form: works without JavaScript and keeps filters in the URL (shareable links)
export function JobFilters({
  lang,
  dict,
  filters,
  categories,
  districts,
  places,
}: {
  lang: Locale;
  dict: Dictionary;
  filters: Filters;
  categories: Category[];
  districts: District[];
  /** Places of the chosen district (filters.district), if any */
  places?: Place[];
}) {
  // The extra filters start open when one of them is in use, so the user sees what is applied
  const moreOpen = !!(filters.type || filters.category || filters.pay || filters.payMin || filters.payMax);

  return (
    // key: navigating keeps this form mounted, and its fields only read defaultValue once.
    // Remounting when the filters change (e.g. "Clear filters", browser back) makes the fields match the URL
    <form
      key={JSON.stringify({ ...filters, page: undefined })}
      action={`/${lang}/jobs`}
      className="space-y-2 rounded-[22px] bg-surface p-2.5 shadow-[0_12px_32px_rgba(23,32,51,0.12)] ring-1 ring-line"
    >
      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-0 flex-[2_1_240px] items-center gap-2.5 rounded-xl bg-surface-2 px-3.5 focus-within:ring-4 focus-within:ring-accent/15">
          <Search className="size-5 shrink-0 text-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder={dict.home.searchPlaceholder}
            aria-label={dict.home.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent py-3.5 text-base outline-none"
          />
        </label>
        <div className="grid min-w-0 flex-[2_1_300px] grid-cols-2 gap-2">
          <LocationSelect
            districts={districts.map((d) => ({ slug: d.slug, label: districtName(dict, d.slug) }))}
            district={filters.district}
            location={filters.location}
            places={places}
            labels={{ allDistricts: dict.home.allDistricts, allVillages: dict.home.allVillages }}
            className={field}
          />
        </div>
        <button type="submit" className={`${buttonClass.primary} flex-[1_0_auto] px-7 text-base`}>
          {dict.home.search}
        </button>
      </div>

      <details open={moreOpen} className="group rounded-xl">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal className="size-4" aria-hidden />
          {dict.home.moreFilters}
        </summary>
        <div className="grid gap-2 px-1 pb-1 pt-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.4fr]">
          <select name="type" defaultValue={filters.type ?? ""} aria-label={dict.home.allTypes} className={field}>
            <option value="">{dict.home.allTypes}</option>
            <option value="FULL_TIME">{dict.jobType.FULL_TIME}</option>
            <option value="PART_TIME">{dict.jobType.PART_TIME}</option>
            <option value="ONE_DAY">{dict.jobType.ONE_DAY}</option>
          </select>
          <select name="category" defaultValue={filters.category ?? ""} aria-label={dict.home.allCategories} className={field}>
            <option value="">{dict.home.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {dict.categories[c.slug as keyof Dictionary["categories"]] ?? c.slug}
              </option>
            ))}
          </select>
          {/* Pay: a period plus an optional range; amounts without a period count as monthly */}
          <select name="pay" defaultValue={filters.pay ?? ""} aria-label={dict.home.allPayTypes} className={field}>
            <option value="">{dict.home.allPayTypes}</option>
            <option value="MONTH">{dict.postJob.payMonth}</option>
            <option value="DAY">{dict.postJob.payDay}</option>
            <option value="HOUR">{dict.postJob.payHour}</option>
            <option value="JOB">{dict.postJob.payJob}</option>
          </select>
          <div className="flex items-center gap-2">
            <input type="number" name="payMin" min={1} inputMode="numeric" defaultValue={filters.payMin} placeholder={dict.home.payMin} aria-label={dict.home.payMin} className={field} />
            <span className="text-muted" aria-hidden>
              –
            </span>
            <input type="number" name="payMax" min={1} inputMode="numeric" defaultValue={filters.payMax} placeholder={dict.home.payMax} aria-label={dict.home.payMax} className={field} />
          </div>
        </div>
      </details>
    </form>
  );
}
