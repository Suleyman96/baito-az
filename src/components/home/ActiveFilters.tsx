import { X } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { filtersHref, type JobFilters } from "@/lib/filters";
import { districtName, t } from "@/lib/format";

/** Applied filters as chips; × removes one, "Clear" removes all. */
export function ActiveFilters({ lang, dict, filters, villageName }: { lang: Locale; dict: Dictionary; filters: JobFilters; villageName?: string }) {
  const payLabel = { MONTH: dict.postJob.payMonth, DAY: dict.postJob.payDay, HOUR: dict.postJob.payHour, JOB: dict.postJob.payJob };
  const { payMin: min, payMax: max } = filters;
  // "200–500 AZN", "200+ AZN" or "≤ 500 AZN"
  const range = min && max ? `${min}–${max} AZN` : min ? `${min}+ AZN` : max ? `≤ ${max} AZN` : "";

  const chips: { key: string; label: string; remove: Partial<Record<keyof JobFilters, undefined>> }[] = [];
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, remove: { q: undefined } });
  if (filters.type) chips.push({ key: "type", label: dict.jobType[filters.type], remove: { type: undefined } });
  if (filters.category) {
    const label = dict.categories[filters.category as keyof Dictionary["categories"]] ?? filters.category;
    chips.push({ key: "category", label, remove: { category: undefined } });
  }
  if (filters.district) chips.push({ key: "district", label: districtName(dict, filters.district), remove: { district: undefined, location: undefined } });
  if (filters.location && villageName) chips.push({ key: "location", label: villageName, remove: { location: undefined } });
  if (filters.pay) {
    chips.push({ key: "pay", label: [payLabel[filters.pay], range].filter(Boolean).join(" · "), remove: { pay: undefined, payMin: undefined, payMax: undefined } });
  }
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link
          key={c.key}
          href={filtersHref(lang, filters, c.remove)}
          aria-label={t(dict.home.removeFilter, { name: c.label })}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft py-1.5 pl-3 pr-2 text-sm font-medium text-brand-strong hover:border-accent"
        >
          {c.label}
          <X className="size-3.5" aria-hidden />
        </Link>
      ))}
      <Link href={`/${lang}/jobs`} className="px-2 py-1.5 text-sm font-medium text-muted underline-offset-4 hover:text-accent hover:underline">
        {dict.home.clear}
      </Link>
    </div>
  );
}
