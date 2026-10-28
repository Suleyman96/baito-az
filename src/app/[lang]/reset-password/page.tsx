import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { InvalidResetLink, ResetPasswordForm } from "@/components/auth/PasswordResetForms";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { hashResetToken, isResetTokenShaped, resetLinkUsable } from "@/lib/auth/password-reset";
import { db } from "@/lib/db";

/** Opened from the link in the reset email (?token=...) */
export default async function ResetPasswordPage({ searchParams }: PageProps<"/[lang]/reset-password">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <AuthCard title={dict.passwordReset.resetTitle}>
      <Suspense fallback={<p className="text-muted">{dict.home.loading}</p>}>
        <Reset lang={lang} dict={dict} searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function Reset({ lang, dict, searchParams }: { lang: Locale; dict: Dictionary; searchParams: PageProps<"/[lang]/reset-password">["searchParams"] }) {
  const { token } = await searchParams;
  // Checked here too, so a dead link says so before a new password is typed; the action checks again
  const link = isResetTokenShaped(token)
    ? await db.passwordResetToken.findUnique({
        where: { id: hashResetToken(token) },
        select: { email: true, expiresAt: true, user: { select: { email: true, blockedAt: true, deletedAt: true } } },
      })
    : null;
  if (!isResetTokenShaped(token) || !link || !resetLinkUsable(link, link.user, new Date())) {
    return <InvalidResetLink lang={lang} t={dict.passwordReset} />;
  }
  return <ResetPasswordForm lang={lang} token={token} t={dict.passwordReset} auth={dict.auth} />;
}
