import type { Metadata } from "next";
import { Montserrat, Noto_Sans } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MainNav, NavList, type NavItem } from "@/components/MainNav";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "@/components/MobileMenu";
import { SiteFooter } from "@/components/SiteFooter";
import { THEME_SCRIPT, ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { site } from "@/config/site";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import "./globals.css";

// latin-ext covers Azerbaijani letters (ə, ğ, ş); Japanese uses the system's Japanese font
const display = Montserrat({ subsets: ["latin", "latin-ext", "cyrillic"], weight: ["600", "700", "800"], variable: "--font-display" });
const body = Noto_Sans({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-body" });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: { default: dict.meta.title, template: `%s · ${site.name}` },
    description: dict.meta.description,
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const sections: NavItem[] = [
    { href: `/${lang}/about`, label: dict.nav.about },
    { href: `/${lang}/jobs`, label: dict.nav.jobs },
    { href: `/${lang}/companies`, label: dict.nav.companies },
    { href: `/${lang}/categories`, label: dict.nav.categories },
  ];
  // The highlighted item depends on the URL, known only at request time; the fallback is the same links unhighlighted
  const nav = (layout: "row" | "column") => (
    <Suspense fallback={<NavList items={sections} label={dict.nav.main} layout={layout} />}>
      <MainNav items={sections} label={dict.nav.main} layout={layout} />
    </Suspense>
  );

  return (
    // The inline script sets data-theme on <html> before React hydrates, hence suppressHydrationWarning
    <html lang={lang} className={`h-full antialiased ${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before the first paint, so the page does not flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      {/* overflow-x-clip: the home page hero spans the full window width */}
      <body className="flex min-h-full flex-col overflow-x-clip">
        <header className="sticky top-0 z-30 border-b border-line bg-background/90 backdrop-blur">
          <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-4 xl:gap-6">
              <Link href={`/${lang}`} aria-label={site.name} className="rounded-xl">
                <Logo />
              </Link>
              <div className="hidden lg:block">{nav("row")}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex">
                <Suspense>
                  <UserMenu lang={lang} dict={dict} layout="row" />
                </Suspense>
              </div>
              <ThemeToggle label={dict.nav.theme} />
              <Suspense>
                <LanguageSwitcher current={lang} label={dict.nav.language} />
              </Suspense>
              <MobileMenu label={dict.nav.menu}>
                {nav("column")}
                <hr className="my-3 border-line" />
                <Suspense>
                  <UserMenu lang={lang} dict={dict} layout="column" />
                </Suspense>
              </MobileMenu>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
        <SiteFooter lang={lang} dict={dict} />
      </body>
    </html>
  );
}
