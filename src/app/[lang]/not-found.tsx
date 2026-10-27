import { Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/errors/BackButton";
import { ErrorState } from "@/components/errors/ErrorState";
import { buttonClass } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getDictionary(await getLocale()).errorPage.notFoundTitle };
}

/** Shown for notFound() in any page and for unknown addresses ([...missing]/page.tsx), inside the site's layout. */
export default async function NotFound() {
  const lang = await getLocale();
  const t = getDictionary(lang).errorPage;
  return (
    <ErrorState badge="404" title={t.notFoundTitle} text={t.notFoundText}>
      <Link href={`/${lang}`} className={buttonClass.primary}>
        <Home className="size-4" aria-hidden />
        {t.home}
      </Link>
      <BackButton label={t.back} fallback={`/${lang}`} />
    </ErrorState>
  );
}
