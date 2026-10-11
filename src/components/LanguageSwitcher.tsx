"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeNames, locales, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  // Swap only the first path segment, keeping the rest of the route
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <nav aria-label="Language" className="flex gap-1 text-sm">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${rest ? `/${rest}` : ""}`}
          aria-current={locale === current ? "true" : undefined}
          className={`rounded-md px-2 py-1 ${
            locale === current
              ? "bg-brand text-white"
              : "text-muted hover:bg-surface-2"
          }`}
        >
          {localeNames[locale]}
        </Link>
      ))}
    </nav>
  );
}
