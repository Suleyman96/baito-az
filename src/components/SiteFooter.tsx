import Link from "next/link";
import { site } from "@/config/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { districtName } from "@/lib/format";
import { Logo } from "./Logo";

export function SiteFooter({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <footer className="bg-footer text-on-footer">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-8 px-4 py-10 sm:px-6">
        <div className="max-w-sm space-y-3 text-white">
          <Logo onDark />
          <p className="text-sm text-on-footer">{dict.footer.text}</p>
        </div>
        <nav aria-label={dict.footer.districts} className="space-y-3">
          <p className="text-sm font-semibold text-white">{dict.footer.districts}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {site.homeDistricts.map((slug) => (
              <li key={slug}>
                <Link href={`/${lang}/jobs?district=${slug}`} className="text-on-footer hover:text-white hover:underline">
                  {districtName(dict, slug)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
