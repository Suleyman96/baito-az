import Link from "next/link";
import type { ReactNode } from "react";
import { isDistrict, site } from "@/config/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { districtName } from "@/lib/format";
import { CurrentYear } from "./CurrentYear";
import { Logo } from "./Logo";

const link = "text-on-footer transition hover:text-white hover:underline";

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title} className="space-y-3">
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="space-y-2 text-sm">{children}</ul>
    </nav>
  );
}

/** Site footer: what Baito.az is, links to the pages that exist, district shortcuts and the copyright line. */
export function SiteFooter({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const f = dict.footer;
  // Shortcuts to a few districts' jobs; every other city and district is one click away on the jobs page.
  // Filtered against the official list, so a district removed from the data never leaves a broken link
  const districts = site.homeDistricts.filter(isDistrict);
  const [before, after] = f.copyright.split("{year}");

  return (
    <footer className="bg-footer text-on-footer">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-x-8 gap-y-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,1fr)]">
          <div className="space-y-3 sm:col-span-2 lg:col-span-1 lg:max-w-xs">
            <Logo onDark />
            <p className="font-semibold text-white">{f.text}</p>
            <p className="text-sm leading-relaxed">{f.tagline}</p>
          </div>

          <Column title={f.seekersTitle}>
            <li>
              <Link href={`/${lang}/jobs`} className={link}>
                {f.jobs}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/workers`} className={link}>
                {f.workers}
              </Link>
            </li>
            <li>
              {/* New visitors sign up and land on the profile form; signed-in job seekers go straight to it */}
              <Link href={`/${lang}/register?next=${encodeURIComponent(`/${lang}/my/profile`)}`} className={link}>
                {f.createProfile}
              </Link>
            </li>
          </Column>

          <Column title={f.employersTitle}>
            <li>
              {/* Guests are sent to employer sign-up and come back to the form */}
              <Link href={`/${lang}/jobs/new`} className={link}>
                {f.postJob}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/workers`} className={link}>
                {f.findCandidates}
              </Link>
            </li>
          </Column>

          <Column title={site.name}>
            <li>
              <Link href={`/${lang}/about`} className={link}>
                {f.about}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/about#contact`} className={link}>
                {f.contact}
              </Link>
            </li>
          </Column>

          <Column title={f.districts}>
            {districts.map((slug) => (
              <li key={slug}>
                <Link href={`/${lang}/jobs?district=${slug}`} className={link}>
                  {districtName(dict, slug)}
                </Link>
              </li>
            ))}
            <li>
              <Link href={`/${lang}/jobs`} className="font-semibold text-white hover:underline">
                {/* Non-breaking space: the arrow never wraps alone onto a new line */}
                {f.allDistricts}&nbsp;→
              </Link>
            </li>
          </Column>
        </div>

        <p className="border-t border-white/10 py-5 text-xs text-on-footer">
          {before}
          <CurrentYear />
          {after}
        </p>
      </div>
    </footer>
  );
}
