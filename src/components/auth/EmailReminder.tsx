import { MailPlus } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Shown on every page to a logged-in account without email: without one, a forgotten password can
 * only be reset by an admin. Goes away once an email is saved in the profile.
 */
export async function EmailReminder({ lang, t }: { lang: Locale; t: Dictionary["account"] }) {
  const user = await getCurrentUser();
  if (!user || user.hasEmail) return null;
  return (
    <p role="note" className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-brand-soft px-3 py-2 text-sm">
      <MailPlus className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">{t.emailReminder}</span>
      <Link href={`/${lang}/account#account-details`} className="font-medium text-accent hover:underline">
        {t.emailReminderAction}
      </Link>
    </p>
  );
}
