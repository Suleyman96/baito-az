import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PageHeader } from "@/components/PageHeader";
import { JobGridSkeleton } from "@/components/Skeletons";
import { site } from "@/config/site";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getCategoryCounts } from "@/lib/companies";
import { filtersHref } from "@/lib/filters";
import { t } from "@/lib/format";

export default async function CategoriesPage() {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-6">
      <PageHeader title={dict.categoriesPage.title} subtitle={dict.categoriesPage.subtitle} />
      <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
        <CategoryGrid lang={lang} dict={dict} />
      </Suspense>
    </div>
  );
}

async function CategoryGrid({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const counts = await getCategoryCounts();
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {site.categories.map((slug) => {
        const count = counts[slug] ?? 0;
        return (
          <li key={slug}>
            <Link
              href={filtersHref(lang, {}, { category: slug })}
              className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-[0_4px_14px_rgba(120,80,30,0.06)] transition hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_10px_24px_rgba(120,80,30,0.12)]"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <CategoryIcon slug={slug} className="size-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-lg font-bold group-hover:text-brand">{dict.categories[slug]}</span>
                <span className={`text-sm ${count ? "font-semibold text-brand-strong" : "text-muted"}`}>
                  {count ? t(dict.categoriesPage.count, { count }) : dict.categoriesPage.none}
                </span>
              </span>
              <ArrowRight className="size-5 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
