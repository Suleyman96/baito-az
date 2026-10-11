import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { JobFilters as Filters } from "@/lib/filters";
import { districtName } from "@/lib/format";
import { LocationSelect } from "./LocationSelect";

type Category = { id: number; slug: string };
type District = { id: number; slug: string; locations: { id: number; name: string }[] };

// Plain GET form: works without JavaScript and keeps filters in the URL (shareable links)
export function JobFilters({
  lang,
  dict,
  filters,
  categories,
  districts,
}: {
  lang: Locale;
  dict: Dictionary;
  filters: Filters;
  categories: Category[];
  districts: District[];
}) {
  const select = "w-full rounded-lg border border-line bg-surface px-3 py-2";

  return (
    <form action={`/${lang}`} className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
      <input
        type="search"
        name="q"
        defaultValue={filters.q}
        placeholder={dict.home.searchPlaceholder}
        aria-label={dict.home.searchPlaceholder}
        className={`${select} sm:col-span-2 lg:col-span-5`}
      />
      <select name="type" defaultValue={filters.type ?? ""} aria-label={dict.home.allTypes} className={select}>
        <option value="">{dict.home.allTypes}</option>
        <option value="FULL_TIME">{dict.jobType.FULL_TIME}</option>
        <option value="PART_TIME">{dict.jobType.PART_TIME}</option>
      </select>
      <select name="category" defaultValue={filters.category ?? ""} aria-label={dict.home.allCategories} className={select}>
        <option value="">{dict.home.allCategories}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {dict.categories[c.slug as keyof Dictionary["categories"]] ?? c.slug}
          </option>
        ))}
      </select>
      <LocationSelect
        districts={districts.map((d) => ({ ...d, label: districtName(dict, d.slug) }))}
        district={filters.district}
        location={filters.location}
        labels={{ allDistricts: dict.home.allDistricts, allVillages: dict.home.allVillages }}
        className={select}
      />
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-strong">
          {dict.home.search}
        </button>
        <Link href={`/${lang}`} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2">
          {dict.home.clear}
        </Link>
      </div>
    </form>
  );
}
