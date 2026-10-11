import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { logout } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";

// Reads the session cookie, so it must render inside <Suspense>
export async function UserMenu({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const user = await getCurrentUser();
  const link = "rounded-md px-2 py-1 text-sm hover:bg-surface-2";

  if (!user) {
    return (
      <nav className="flex items-center gap-1">
        <Link href={`/${lang}/register?role=EMPLOYER`} className={`${link} hidden text-muted sm:block`}>
          {dict.nav.postJob}
        </Link>
        <Link href={`/${lang}/login`} className={link}>
          {dict.nav.login}
        </Link>
        <Link href={`/${lang}/register`} className="rounded-md bg-brand px-3 py-1 text-sm font-medium text-white hover:bg-brand-strong">
          {dict.nav.register}
        </Link>
      </nav>
    );
  }

  return (
    <form action={logout} className="flex items-center gap-2 text-sm">
      <input type="hidden" name="lang" value={lang} />
      <span className="max-w-40 truncate font-medium">{user.name}</span>
      <button type="submit" className={`${link} text-muted`}>
        {dict.auth.logout}
      </button>
    </form>
  );
}
