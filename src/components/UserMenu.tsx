import { Plus } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getPendingCount } from "@/lib/admin";
import { getUnseenApplicationCount } from "@/lib/application-queries";
import { logout } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { AccountMenu } from "./AccountMenu";
import { Avatar } from "./Avatar";
import { LogoutButton } from "./LogoutButton";

const badge = (count: number) =>
  count > 0 && <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-xs font-bold text-on-brand">{count}</span>;

/**
 * Account links. "row" is the desktop header: the main action plus an account dropdown, so the
 * header keeps room for the site's section links. "column" lists everything in the phone menu.
 * Reads the session cookie, so it must render inside <Suspense>.
 */
export async function UserMenu({ lang, dict, layout }: { lang: Locale; dict: Dictionary; layout: "row" | "column" }) {
  const user = await getCurrentUser();
  const column = layout === "column";
  const link = `flex items-center rounded-xl px-3 py-2.5 font-medium text-muted hover:bg-surface-2 hover:text-foreground ${column ? "text-base" : "text-sm"}`;
  const primary = `inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-brand px-4 py-2.5 font-semibold text-on-brand hover:bg-brand-strong ${column ? "text-base" : "text-sm"}`;

  if (!user) {
    return (
      <nav className={column ? "flex flex-col items-stretch gap-1" : "flex items-center gap-1"}>
        {/* On narrower desktops the header keeps room for the section links; this link is in the page instead */}
        <Link href={`/${lang}/jobs/new`} className={column ? link : `${link} hidden 2xl:flex`}>
          {dict.nav.postJob}
        </Link>
        <Link href={`/${lang}/login`} className={`${link} text-foreground`}>
          {dict.nav.login}
        </Link>
        <Link href={`/${lang}/register`} className={primary}>
          {dict.nav.register}
        </Link>
      </nav>
    );
  }

  // Admins see how many jobs wait for review; employers, how many applications they have not opened yet
  const pending = user.role === "ADMIN" ? await getPendingCount() : 0;
  const unseen = user.role === "EMPLOYER" ? await getUnseenApplicationCount(user.id) : 0;

  const accountLinks = (
    <form action={logout} className="flex flex-col items-stretch gap-1">
      <input type="hidden" name="lang" value={lang} />
      <Link href={`/${lang}/account`} className={`${link} gap-2 text-foreground`}>
        <Avatar name={user.name} imageId={user.avatarId} size="sm" />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{user.name}</span>
          <span className="block text-xs font-normal text-muted">{dict.account.title}</span>
        </span>
      </Link>
      {user.role === "EMPLOYER" && (
        <>
          <Link href={`/${lang}/my/applications`} className={link}>
            {dict.nav.applications}
            {badge(unseen)}
          </Link>
          <Link href={`/${lang}/my/jobs`} className={link}>
            {dict.nav.myJobs}
          </Link>
        </>
      )}
      {user.role === "SEEKER" && (
        <>
          <Link href={`/${lang}/my/profile`} className={link}>
            {dict.nav.myProfile}
          </Link>
          <Link href={`/${lang}/my/applications`} className={link}>
            {dict.nav.myApplications}
          </Link>
        </>
      )}
      {user.role === "ADMIN" && (
        <Link href={`/${lang}/admin`} className={link}>
          {dict.nav.admin}
          {badge(pending)}
        </Link>
      )}
      {user.role !== "ADMIN" && (
        <Link href={`/${lang}/my/reviews`} className={link}>
          {dict.nav.reviews}
        </Link>
      )}
      <hr className="my-1 border-line" />
      <LogoutButton
        className={`${link} gap-2`}
        showLabel
        texts={{ logout: dict.auth.logout, question: dict.auth.logoutQuestion, cancel: dict.auth.cancel }}
      />
    </form>
  );

  const postJob = user.role === "EMPLOYER" && (
    <Link href={`/${lang}/jobs/new`} aria-label={dict.nav.postJob} title={dict.nav.postJob} className={primary}>
      <Plus className="size-4" aria-hidden />
      {/* Text on wide screens; on narrower desktops the + button keeps the header on one line */}
      <span className={column ? "" : "hidden 2xl:inline"}>{dict.nav.postJob}</span>
    </Link>
  );

  if (column) {
    return (
      <div className="flex flex-col items-stretch gap-2">
        {postJob}
        {accountLinks}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {postJob}
      <AccountMenu
        label={user.name}
        trigger={
          <span className="relative flex items-center gap-2">
            <Avatar name={user.name} imageId={user.avatarId} size="sm" />
            <span className="hidden max-w-36 truncate text-sm font-medium 2xl:inline">{user.name}</span>
            {/* Waiting items stay visible while the menu is closed */}
            {pending + unseen > 0 && (
              <span className="absolute -left-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-brand">
                {pending + unseen}
              </span>
            )}
          </span>
        }
      >
        {accountLinks}
      </AccountMenu>
    </div>
  );
}
