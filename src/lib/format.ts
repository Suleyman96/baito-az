import type { Locale } from "@/i18n/config";
import { site } from "@/config/site";
import type { Dictionary } from "@/i18n/dictionaries";

// Fills "{name}" placeholders in a translated string
export function t(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}

type SalaryLabels = { negotiable: string; from: string; upTo: string };

export function formatSalary(
  min: number | null,
  max: number | null,
  labels: SalaryLabels,
) {
  const currency = site.currency;
  if (min && max) return `${min}–${max} ${currency}`;
  if (min) return t(labels.from, { min, currency });
  if (max) return t(labels.upTo, { max, currency });
  return labels.negotiable;
}

export function formatRelativeDate(date: Date, locale: Locale, now = new Date()) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return rtf.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return rtf.format(0, "minute");
}

export function districtName(dict: Pick<Dictionary, "districts">, slug: string) {
  return dict.districts[slug as keyof Dictionary["districts"]] ?? slug;
}

// "Car, Zaqatala"; the district's own town is shown on its own
export function formatPlace(location: { name: string; district: { slug: string } }, dict: Pick<Dictionary, "districts">) {
  const district = districtName(dict, location.district.slug);
  return location.name.startsWith(district) ? location.name : `${location.name}, ${district}`;
}
