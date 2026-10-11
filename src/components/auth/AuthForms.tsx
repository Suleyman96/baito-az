"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { login, register, type AuthFormState } from "@/lib/auth/actions";

type Texts = Dictionary["auth"];

const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 aria-invalid:border-red-500";
const submit = "w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-strong disabled:opacity-60";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="block text-sm text-red-600 dark:text-red-400">{error}</span> : hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
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
              className="cursor-pointer rounded-xl border-2 border-line bg-surface p-4 has-checked:border-brand has-checked:bg-brand-soft"
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
        <input name="name" defaultValue={v.name} autoComplete="name" required aria-invalid={!!err("name")} className={input} />
      </Field>

      <div className="hidden group-has-[#role-EMPLOYER:checked]:block">
        <Field label={t.companyName} error={err("companyName")}>
          <input name="companyName" defaultValue={v.companyName} autoComplete="organization" aria-invalid={!!err("companyName")} className={input} />
        </Field>
      </div>

      <div className="space-y-3 rounded-xl border border-line p-3">
        <p className="text-sm text-muted">{t.contactHint}</p>
        <Field label={t.phone} hint={t.phoneHint} error={err("phone")}>
          <input name="phone" type="tel" inputMode="tel" defaultValue={v.phone} autoComplete="tel" aria-invalid={!!err("phone")} className={input} />
        </Field>
        <Field label={t.email} error={err("email")}>
          <input name="email" type="email" defaultValue={v.email} autoComplete="email" aria-invalid={!!err("email")} className={input} />
        </Field>
      </div>

      <Field label={t.password} hint={t.passwordHint} error={err("password")}>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} aria-invalid={!!err("password")} className={input} />
      </Field>

      <button type="submit" disabled={pending} className={submit}>
        {t.submitRegister}
      </button>
      <p className="text-center text-sm text-muted">
        {t.haveAccount}{" "}
        <Link href={`/${lang}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-brand hover:underline">
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
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {formError}
        </p>
      )}
      <Field label={t.identifier} hint={t.phoneHint}>
        <input name="identifier" defaultValue={state?.values.identifier} autoComplete="username" required className={input} />
      </Field>
      <Field label={t.password}>
        <input name="password" type="password" autoComplete="current-password" required className={input} />
      </Field>

      <button type="submit" disabled={pending} className={submit}>
        {t.submitLogin}
      </button>
      <p className="text-center text-sm text-muted">
        {t.noAccount}{" "}
        <Link href={`/${lang}/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-brand hover:underline">
          {t.submitRegister}
        </Link>
      </p>
    </form>
  );
}
