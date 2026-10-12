import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getAdminStats } from "@/lib/admin";
import { requireAdminPage } from "@/lib/admin-guard";
import { t } from "@/lib/format";

export default async function AdminOverviewPage() {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <Suspense fallback={<p className="text-muted">{dict.home.loading}</p>}>
      <Overview lang={lang} dict={dict} />
    </Suspense>
  );
}

function Stat({ label, value, children, href }: { label: string; value: number; children?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </>
  );
  const box = "block rounded-xl border border-line bg-surface p-4";
  return href ? (
    <Link href={href} className={`${box} hover:border-brand`}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}

async function Overview({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  await requireAdminPage();
  const s = await getAdminStats();
  const o = dict.admin.overview;

  return (
    <div className="space-y-4">
      {s.pending > 0 && (
        <Link
          href={`/${lang}/admin/jobs`}
          className="flex items-center justify-between gap-3 rounded-xl bg-accent-soft px-4 py-3 font-medium text-accent hover:opacity-90"
        >
          <span>
            {o.pending}: {s.pending}
          </span>
          <span>{o.review} →</span>
        </Link>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={o.pending} value={s.pending} href={`/${lang}/admin/jobs?tab=PENDING`} />
        <Stat label={o.active} value={s.active} href={`/${lang}/admin/jobs?tab=ACTIVE`} />
        <Stat label={o.oneDaySoon} value={s.oneDaySoon} href={`/${lang}?type=ONE_DAY`} />
        <Stat label={o.newUsers} value={s.newSeekers + s.newEmployers} href={`/${lang}/admin/users`}>
          {t(o.newSeekers, { count: s.newSeekers })} · {t(o.newEmployers, { count: s.newEmployers })}
        </Stat>
      </div>
      <p className="text-sm text-muted">
        {o.totalUsers}: {s.totalUsers}
        {s.blocked > 0 && ` · ${t(o.blockedUsers, { count: s.blocked })}`}
      </p>
    </div>
  );
}
