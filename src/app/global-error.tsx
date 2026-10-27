"use client"; // Error boundaries must be Client Components

import { Home, RotateCw, TriangleAlert } from "lucide-react";
import { Montserrat, Noto_Sans } from "next/font/google";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ErrorState } from "@/components/errors/ErrorState";
import { THEME_SCRIPT } from "@/components/ThemeToggle";
import { buttonClass } from "@/components/ui";
import { globalErrorTexts, localeFromPath } from "@/i18n/global-error-texts";
import "./[lang]/globals.css";

// Same fonts as the root layout, which this page replaces
const display = Montserrat({ subsets: ["latin", "latin-ext", "cyrillic"], weight: ["600", "700", "800"], variable: "--font-display" });
const body = Noto_Sans({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-body" });

/**
 * Shown when the root layout itself fails, so it brings its own <html>, <body>, styles, fonts and
 * theme. No technical detail of the error is shown.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const lang = localeFromPath(usePathname());
  const t = globalErrorTexts[lang];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={lang} className={`h-full antialiased ${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <title>{t.errorTitle}</title>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <ErrorState badge={<TriangleAlert className="size-16 sm:size-20" />} title={t.errorTitle} text={t.errorText}>
            <button type="button" onClick={() => retry()} className={buttonClass.primary}>
              <RotateCw className="size-4" aria-hidden />
              {t.retry}
            </button>
            {/* A full page load: the layout that failed has to be built again from scratch */}
            <a href={`/${lang}`} className={buttonClass.secondary}>
              <Home className="size-4" aria-hidden />
              {t.home}
            </a>
          </ErrorState>
        </main>
      </body>
    </html>
  );
}
