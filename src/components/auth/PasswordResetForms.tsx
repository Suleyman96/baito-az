"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buttonClass, Field, inputClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { requestPasswordReset, resetPassword } from "@/lib/auth/password-reset-actions";

type Texts = { t: Dictionary["passwordReset"]; auth: Dictionary["auth"] };

function BackToLogin({ lang, t }: { lang: Locale; t: Texts["t"] }) {
  return (
    <p className="text-center text-sm">
      <Link href={`/${lang}/login`} className="font-medium text-accent hover:underline">
        {t.backToLogin}
      </Link>
    </p>
  );
}

/** "Forgot password": asks for the email; the answer is the same whether or not the account exists */
export function ForgotPasswordForm({ lang, minutes, t, auth }: { lang: Locale; minutes: number } & Texts) {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.sent) {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-lg bg-brand-soft px-3 py-2 text-sm">
          {t.sentText.replace("{email}", state.email).replace("{minutes}", String(minutes))}
        </p>
        <BackToLogin lang={lang} t={t} />
      </div>
    );
  }

  const error = state?.error ? auth.errors[state.error] : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <p className="text-sm text-muted">{t.forgotText}</p>
      <Field label={auth.email} error={error}>
        <input name="email" type="email" defaultValue={state?.email} autoComplete="email" required aria-invalid={!!error} className={inputClass} />
      </Field>
      <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
        {t.submitRequest}
      </button>
      <p className="text-sm text-muted">{t.phoneOnly}</p>
      <BackToLogin lang={lang} t={t} />
    </form>
  );
}

/** Shown instead of the form when a reset link is used, expired or wrong */
export function InvalidResetLink({ lang, t }: { lang: Locale; t: Texts["t"] }) {
  return (
    <div className="space-y-4">
      <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-sm text-error">
        <strong className="block">{t.invalidTitle}</strong>
        {t.invalidText}
      </p>
      <Link href={`/${lang}/forgot-password`} className={`${buttonClass.primary} w-full`}>
        {t.requestNew}
      </Link>
      <BackToLogin lang={lang} t={t} />
    </div>
  );
}

/** The new password, through a reset link */
export function ResetPasswordForm({ lang, token, t, auth }: { lang: Locale; token: string } & Texts) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  // The link was used up or expired while the page was open
  if (state?.error === "linkInvalid") return <InvalidResetLink lang={lang} t={t} />;

  const error = state?.error ? auth.errors[state.error] : undefined;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-muted">{t.resetText}</p>
      <Field label={t.newPassword} hint={auth.passwordHint} error={error}>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} aria-invalid={!!error} className={inputClass} />
      </Field>
      <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
        {t.submitReset}
      </button>
    </form>
  );
}
