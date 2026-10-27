"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buttonClass, Field, inputClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { login, register, type AuthFormState } from "@/lib/auth/actions";

type Texts = Dictionary["auth"];

// "I accept the {terms} and the {privacy}" with both names as links. They open in a new tab,
// so reading them does not lose what was typed in the form
function TermsText({ lang, t }: { lang: Locale; t: Texts }) {
  const links: Record<string, { href: string; label: string }> = {
    "{terms}": { href: `/${lang}/terms`, label: t.termsLink },
    "{privacy}": { href: `/${lang}/privacy-policy`, label: t.privacyLink },
  };
  return t.acceptTerms.split(/(\{terms\}|\{privacy\})/).map((part) => {
    const link = links[part];
    if (!link) return part;
    return (
      <Link key={part} href={link.href} target="_blank" className="font-medium text-accent hover:underline">
        {link.label}
      </Link>
    );
  });
}

function errorText(t: Texts, state: AuthFormState, field: string) {
  const key = state?.errors[field];
  return key ? t.errors[key] : undefined;
}

export function RegisterForm({ lang, next, role, t }: { lang: Locale; next?: string; role: "SEEKER" | "EMPLOYER"; t: Texts }) {
  const [state, action, pending] = useActionState(register, undefined);
  const v = state?.values ?? {};
  const err = (field: string) => errorText(t, state, field);
  const selectedRole = v.role === "EMPLOYER" || v.role === "SEEKER" ? v.role : role;

  return (
    // "group" lets the company field react to the employer radio with CSS only, so it also works without JavaScript
    <form action={action} className="group space-y-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      {next && <input type="hidden" name="next" value={next} />}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t.roleQuestion}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["SEEKER", "EMPLOYER"] as const).map((r) => (
            <label
              key={r}
              className="cursor-pointer rounded-xl border-2 border-line bg-surface p-4 has-checked:border-accent has-checked:bg-brand-soft"
            >
              <input
                type="radio"
                name="role"
                value={r}
                id={`role-${r}`}
                defaultChecked={selectedRole === r}
                className="sr-only"
              />
              <span className="block text-2xl" aria-hidden>
                {r === "SEEKER" ? "🔍" : "🏢"}
              </span>
              <span className="mt-1 block font-semibold">{r === "SEEKER" ? t.roleSeeker : t.roleEmployer}</span>
              <span className="block text-sm text-muted">{r === "SEEKER" ? t.roleSeekerHint : t.roleEmployerHint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={t.name} error={err("name")}>
        <input name="name" defaultValue={v.name} autoComplete="name" required aria-invalid={!!err("name")} className={inputClass} />
      </Field>

      <div className="hidden group-has-[#role-EMPLOYER:checked]:block">
        <Field label={t.companyName} hint={t.companyHint} error={err("companyName")}>
          <input name="companyName" defaultValue={v.companyName} autoComplete="organization" aria-invalid={!!err("companyName")} className={inputClass} />
        </Field>
      </div>

      <div className="space-y-3 rounded-xl border border-line p-3">
        <p className="text-sm text-muted">{t.contactHint}</p>
        <Field label={t.phone} hint={t.phoneHint} error={err("phone")}>
          <input name="phone" type="tel" inputMode="tel" defaultValue={v.phone} autoComplete="tel" aria-invalid={!!err("phone")} className={inputClass} />
        </Field>
        <Field label={t.email} error={err("email")}>
          <input name="email" type="email" defaultValue={v.email} autoComplete="email" aria-invalid={!!err("email")} className={inputClass} />
        </Field>
      </div>

      <Field label={t.password} hint={t.passwordHint} error={err("password")}>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} aria-invalid={!!err("password")} className={inputClass} />
      </Field>

      <div className="space-y-1.5">
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="acceptTerms"
            defaultChecked={v.acceptTerms === "on"}
            required
            aria-invalid={!!err("acceptTerms")}
            aria-describedby={err("acceptTerms") ? "acceptTerms-error" : undefined}
            className="mt-0.5 size-4 shrink-0 accent-accent"
          />
          <span>
            <TermsText lang={lang} t={t} />
          </span>
        </label>
        {err("acceptTerms") && (
          <p id="acceptTerms-error" className="text-sm text-error">
            {err("acceptTerms")}
          </p>
        )}
      </div>

      <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
        {t.submitRegister}
      </button>
      <p className="text-center text-sm text-muted">
        {t.haveAccount}{" "}
        <Link href={`/${lang}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-accent hover:underline">
          {t.submitLogin}
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({ lang, next, t }: { lang: Locale; next?: string; t: Texts }) {
  const [state, action, pending] = useActionState(login, undefined);
  const formError = errorText(t, state, "form");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="lang" value={lang} />
      {next && <input type="hidden" name="next" value={next} />}

      {formError && (
        <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-sm text-error">
          {formError}
        </p>
      )}
      <Field label={t.identifier} hint={t.phoneHint}>
        <input name="identifier" defaultValue={state?.values.identifier} autoComplete="username" required className={inputClass} />
      </Field>
      <Field label={t.password}>
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>

      <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
        {t.submitLogin}
      </button>
      <p className="text-center text-sm text-muted">
        {t.noAccount}{" "}
        <Link href={`/${lang}/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-accent hover:underline">
          {t.submitRegister}
        </Link>
      </p>
    </form>
  );
}
