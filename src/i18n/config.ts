// Client-safe locale settings (no dictionary contents here)
export const locales = ["az", "en", "ja", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "az";

// Short labels shown in the header (ISO 639-2)
export const localeCodes: Record<Locale, string> = {
  az: "AZE",
  en: "ENG",
  ja: "JPN",
  ru: "RUS",
};

// Each language is named in itself, so people can find their own
export const localeNames: Record<Locale, string> = {
  az: "Azərbaycanca",
  en: "English",
  ja: "日本語",
  ru: "Русский",
};

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
