import type { Locale } from "@/i18n/config";
import { site } from "@/config/site";
import { regions } from "@/config/regions";
import type { Dictionary } from "@/i18n/dictionaries";

// Fills "{name}" placeholders in a translated string
export function t(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}

type SalaryLabels = { negotiable: string; from: string; upTo: string };

/** An amount in the page's language: whole ones as they are ("450"), others with 2 decimals ("3,50" / "3.50") */
export function formatAmount(amount: number, locale: Locale) {
  const decimals = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: 2, useGrouping: false }).format(amount);
}

export function formatSalary(
  min: number | null,
  max: number | null,
  labels: SalaryLabels,
  locale: Locale,
) {
  const currency = site.currency;
  const fmt = (n: number) => formatAmount(n, locale);
  if (min && max) return `${fmt(min)}–${fmt(max)} ${currency}`;
  if (min) return t(labels.from, { min: fmt(min), currency });
  if (max) return t(labels.upTo, { max: fmt(max), currency });
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
  return dict.districts[slug as keyof Dictionary["districts"]] ?? regions.find((r) => r.slug === slug)?.name ?? slug;
}

// "Car, Zaqatala"; the district's own town is shown on its own
export function formatPlace(location: { name: string; district: { slug: string } }, dict: Pick<Dictionary, "districts">) {
  const district = districtName(dict, location.district.slug);
  return location.name.startsWith(district) ? location.name : `${location.name}, ${district}`;
}

/** "20 oktyabr, çərşənbə axşamı, 09:30", always in Azerbaijan time regardless of the server or browser time zone. */
export function formatWorkStart(date: Date, locale: Locale) {
  // Date and time are formatted separately: combined, some locales join them oddly (e.g. "Ç.a./09:30")
  const day = new Intl.DateTimeFormat(locale, { timeZone: "Asia/Baku", weekday: "long", day: "numeric", month: "long" }).format(date);
  const time = new Intl.DateTimeFormat(locale, { timeZone: "Asia/Baku", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return `${day}, ${time}`;
}

/** Midnight in Baku (UTC+4, no daylight saving) of the day `now` falls on, plus `days`. */
export function bakuMidnight(now: Date, days = 0) {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku" }).format(now);
  return new Date(new Date(`${date}T00:00:00+04:00`).getTime() + days * 24 * 60 * 60 * 1000);
}

/** "245 KB", "1.2 MB" */
export function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
