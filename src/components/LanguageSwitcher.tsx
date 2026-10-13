"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { localeCodes, localeNames, locales, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function change(locale: string) {
    // Swap only the first path segment, keeping the rest of the route and the filters in the query
    const rest = pathname.split("/").slice(2).join("/");
    const query = searchParams.toString();
    router.push(`/${locale}${rest ? `/${rest}` : ""}${query ? `?${query}` : ""}`);
  }

  // Shows a short code ("AZE"); the native select lies invisibly on top, so its list shows full names
  return (
    <label className="relative inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium tracking-wide hover:bg-surface-2 focus-within:ring-2 focus-within:ring-accent">
      <span aria-hidden>{localeCodes[current]}</span>
      <svg viewBox="0 0 24 24" className="size-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m7 9 5-5 5 5M7 15l5 5 5-5" />
      </svg>
      <select
        value={current}
        onChange={(e) => change(e.target.value)}
        aria-label={label}
        title={label}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale} lang={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}
