import "server-only";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { hasLocale, type Locale } from "./config";
import az from "./dictionaries/az.json";
import en from "./dictionaries/en.json";
import ja from "./dictionaries/ja.json";
import ru from "./dictionaries/ru.json";

export type Dictionary = typeof az;

// Typing each entry as Dictionary makes a missing translation key a compile error
const dictionaries: Record<Locale, Dictionary> = { az, en, ja, ru };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

// Reads the [lang] root segment without awaiting a page's full params,
// so pages with other dynamic segments can still prerender their static shell
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!hasLocale(value)) notFound();
  return value;
}
