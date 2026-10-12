import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { Avatar } from "@/components/Avatar";
import { getAdminUsers, parseAdminUsersQuery } from "@/lib/admin";
import { requireAdminPage } from "@/lib/admin-guard";
import { t } from "@/lib/format";
import { setUserBlocked } from "@/lib/job-actions";

export default async function AdminUsersPage({ searchParams }: PageProps<"/[lang]/admin/users">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <Suspense fallback={<p className="text-muted">{dict.home.loading}</p>}>
      <AdminUsers lang={lang} dict={dict} searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminUsers({
  lang,
  dict,
  searchParams,
}: {
  lang: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[lang]/admin/users">["searchParams"];
}) {
  await requireAdminPage();
  const query = parseAdminUsersQuery(await searchParams);
  const users = await getAdminUsers(query);
  const a = dict.admin;
  const field = "rounded-lg border border-line bg-surface px-3 py-2";
  const date = new Intl.DateTimeFormat(lang, { timeZone: "Asia/Baku", day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-4">
      <form action={`/${lang}/admin/users`} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input type="search" name="q" defaultValue={query.q} placeholder={a.searchUsers} aria-label={a.searchUsers} className={field} />
        <select name="role" defaultValue={query.role ?? ""} aria-label={a.allRoles} className={field}>
          <option value="">{a.allRoles}</option>
          {(["SEEKER", "EMPLOYER", "ADMIN"] as const).map((r) => (
            <option key={r} value={r}>
              {a.roles[r]}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-brand px-4 py-2 font-medium text-on-brand hover:bg-brand-strong">
          {a.search}
        </button>
      </form>
      <p className="text-sm text-muted">{a.blockHint}</p>

      {users.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">{a.noUsers}</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <Avatar name={u.name} imageId={u.avatarId} size="md" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-semibold">
                  {u.name}
                  <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-normal text-muted">{a.roles[u.role]}</span>
                  {u.blockedAt && (
                    <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-normal text-red-700 dark:bg-red-950 dark:text-red-300">{a.blockedBadge}</span>
                  )}
                </p>
                <p className="truncate text-sm text-muted">{[u.phone, u.email].filter(Boolean).join(" · ")}</p>
                <p className="text-sm text-muted">
                  {u.company && u.company.name !== u.name && `${u.company.name} · `}
                  {u.company && `${t(a.jobsCount, { count: u.company._count.jobs })} · `}
                  {t(a.joined, { date: date.format(u.createdAt) })}
                </p>
              </div>
              {/* Admins cannot be blocked (also enforced in the action) */}
              {u.role !== "ADMIN" && (
                <form action={setUserBlocked}>
                  <input type="hidden" name="lang" value={lang} />
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="block" value={u.blockedAt ? "0" : "1"} />
                  <button
                    className={`rounded-lg border px-4 py-2 text-sm ${
                      u.blockedAt ? "border-line hover:bg-surface-2" : "border-line hover:border-red-500 hover:text-red-600"
                    }`}
                  >
                    {u.blockedAt ? a.unblock : a.block}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      {users.length >= 100 && <p className="text-sm text-muted">{a.limitNote}</p>}
    </div>
  );
}
