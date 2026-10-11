// Client-safe locale settings (no dictionary contents here)
export const locales = ["az", "en", "ja", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "az";

export const localeNames: Record<Locale, string> = {
  az: "AZ",
  en: "EN",
  ja: "日本語",
  ru: "RU",
};

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
