import { Search, SlidersHorizontal } from "lucide-react";
import { professionGroups } from "@/config/professions";
import { DISTRICT_SLUGS } from "@/config/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { districtName, t } from "@/lib/format";
import { EXPERIENCE_STEPS, type WorkerFilters as Filters } from "@/lib/worker-filters";
import { buttonClass } from "../ui";

// Same look and behavior as the job filters: a plain GET form, so filters live in the URL
const field = "w-full rounded-xl border border-transparent bg-surface-2 px-3.5 py-3 text-base outline-none transition focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/15";

export function WorkerFilters({ lang, dict, filters }: { lang: Locale; dict: Dictionary; filters: Filters }) {
  const w = dict.workers;
  const moreOpen = !!(filters.type || filters.exp || filters.pay || filters.payMax || filters.avail);
  // Professions of the chosen field only, so the list stays short
  const groups = filters.group ? professionGroups.filter((g) => g.slug === filters.group) : professionGroups;

  return (
    // key: remount when the filters change, so the fields always match the URL (as in the job filters)
    <form key={JSON.stringify({ ...filters, page: undefined })} action={`/${lang}/workers`} className="space-y-2 rounded-[22px] bg-surface p-2.5 shadow-[0_12px_32px_rgba(23,32,51,0.12)] ring-1 ring-line">
      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-0 flex-[2_1_240px] items-center gap-2.5 rounded-xl bg-surface-2 px-3.5 focus-within:ring-4 focus-within:ring-accent/15">
          <Search className="size-5 shrink-0 text-muted" aria-hidden />
          <input type="search" name="q" defaultValue={filters.q} placeholder={w.searchPlaceholder} aria-label={w.searchPlaceholder} className="min-w-0 flex-1 bg-transparent py-3.5 text-base outline-none" />
        </label>
        <div className="grid min-w-0 flex-[3_1_420px] grid-cols-1 gap-2 sm:grid-cols-3">
          <select name="group" defaultValue={filters.group ?? ""} aria-label={w.allGroups} className={field}>
            <option value="">{w.allGroups}</option>
            {professionGroups.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name[lang]}
              </option>
            ))}
          </select>
          <select name="profession" defaultValue={filters.profession ?? ""} aria-label={w.allProfessions} className={field}>
            <option value="">{w.allProfessions}</option>
            {groups.map((g) => (
              <optgroup key={g.slug} label={g.name[lang]}>
                {g.items.map((i) => (
                  <option key={i.slug} value={i.slug}>
                    {i.name[lang]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <select name="district" defaultValue={filters.district ?? ""} aria-label={dict.home.allDistricts} className={field}>
            <option value="">{dict.home.allDistricts}</option>
            {DISTRICT_SLUGS.map((d) => (
              <option key={d} value={d}>
                {districtName(dict, d)}
              </option>
            ))}
          </select>
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
        <div className="grid gap-2 px-1 pb-1 pt-1 sm:grid-cols-2 lg:grid-cols-4">
          <select name="type" defaultValue={filters.type ?? ""} aria-label={dict.home.allTypes} className={field}>
            <option value="">{dict.home.allTypes}</option>
            <option value="FULL_TIME">{dict.jobType.FULL_TIME}</option>
            <option value="PART_TIME">{dict.jobType.PART_TIME}</option>
            <option value="ONE_DAY">{dict.jobType.ONE_DAY}</option>
          </select>
          <select name="exp" defaultValue={filters.exp?.toString() ?? ""} aria-label={w.anyExperience} className={field}>
            <option value="">{w.anyExperience}</option>
            {EXPERIENCE_STEPS.map((years) => (
              <option key={years} value={years}>
                {t(w.experienceAtLeast, { years })}
              </option>
            ))}
          </select>
          <select name="avail" defaultValue={filters.avail ?? ""} aria-label={w.anyAvailability} className={field}>
            <option value="">{w.anyAvailability}</option>
            <option value="now">{w.availNow}</option>
            <option value="weekdays">{w.availWeekdays}</option>
            <option value="weekends">{w.availWeekends}</option>
          </select>
          <div className="flex gap-2">
            <select name="pay" defaultValue={filters.pay ?? ""} aria-label={dict.home.allPayTypes} className={field}>
              <option value="">{dict.home.allPayTypes}</option>
              <option value="MONTH">{dict.postJob.payMonth}</option>
              <option value="DAY">{dict.postJob.payDay}</option>
              <option value="HOUR">{dict.postJob.payHour}</option>
            </select>
            <input type="number" name="payMax" min={1} inputMode="numeric" defaultValue={filters.payMax} placeholder={w.payMax} aria-label={w.payMax} className={field} />
          </div>
        </div>
      </details>
      {filters.sort !== "relevance" && <input type="hidden" name="sort" value={filters.sort} />}
    </form>
  );
}
