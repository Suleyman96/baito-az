"use client";

import { useActionState, type ReactNode } from "react";
import { MapPicker } from "@/components/maps/MapPicker";
import { buttonClass, Field, inputClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { changePassword, updateAccount, updateCompany, type AccountFormState } from "@/lib/auth/account-actions";



/** One profile section: its own form, action and "saved" message. */
function Section({
  title,
  hint,
  lang,
  action,
  dict,
  submitLabel,
  savedText,
  children,
}: {
  title: string;
  hint?: string;
  lang: Locale;
  action: (prev: AccountFormState, formData: FormData) => Promise<AccountFormState>;
  dict: Dictionary;
  submitLabel: string;
  savedText: string;
  children: (state: AccountFormState, err: (field: string) => string | undefined) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const err = (field: string) => {
    const key = state?.errors[field];
    return key ? dict.auth.errors[key] : undefined;
  };

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {/* key: React resets uncontrolled fields after an action; remounting with the returned values keeps them */}
      <form key={JSON.stringify(state?.values ?? {})} action={formAction} className="mt-4 space-y-4" noValidate>
        <input type="hidden" name="lang" value={lang} />
        {children(state, err)}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={buttonClass.primary}>
            {submitLabel}
          </button>
          {state?.saved && (
            <span role="status" className="text-sm text-success">
              ✓ {savedText}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

export function AccountForms({
  lang,
  dict,
  user,
  company,
}: {
  lang: Locale;
  dict: Dictionary;
  user: { name: string; email: string; phone: string };
  /** Only employers have a company */
  company?: { name: string; description: string; phone: string; address: string; latitude: string; longitude: string };
}) {
  const t = dict.account;
  const a = dict.auth;

  return (
    <div className="space-y-4">
      <Section title={t.accountSection} hint={a.contactHint} lang={lang} action={updateAccount} dict={dict} submitLabel={t.save} savedText={t.saved}>
        {(state, err) => {
          const v = state?.values ?? user;
          return (
            <>
              <Field label={a.name} error={err("name")}>
                <input name="name" defaultValue={v.name} autoComplete="name" aria-invalid={!!err("name")} className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={a.phone} hint={a.phoneHint} error={err("phone")}>
                  <input name="phone" type="tel" inputMode="tel" defaultValue={v.phone} autoComplete="tel" aria-invalid={!!err("phone")} className={inputClass} />
                </Field>
                <Field label={a.email} error={err("email")}>
                  <input name="email" type="email" defaultValue={v.email} autoComplete="email" aria-invalid={!!err("email")} className={inputClass} />
                </Field>
              </div>
            </>
          );
        }}
      </Section>

      {company && (
        <Section title={t.companySection} hint={t.companyHint} lang={lang} action={updateCompany} dict={dict} submitLabel={t.save} savedText={t.saved}>
          {(state, err) => {
            const v = state?.values ?? {
              companyName: company.name,
              description: company.description,
              phone: company.phone,
              address: company.address,
              latitude: company.latitude,
              longitude: company.longitude,
            };
            return (
              <>
                <Field label={a.companyName} hint={a.companyHint} error={err("companyName")}>
                  <input name="companyName" defaultValue={v.companyName} autoComplete="organization" aria-invalid={!!err("companyName")} className={inputClass} />
                </Field>
                <Field label={t.description} error={err("description")}>
                  <textarea name="description" rows={3} maxLength={1000} defaultValue={v.description} placeholder={t.descriptionPlaceholder} aria-invalid={!!err("description")} className={inputClass} />
                </Field>
                <Field label={t.companyPhone} hint={t.companyPhoneHint} error={err("phone")}>
                  <input name="phone" type="tel" inputMode="tel" defaultValue={v.phone} aria-invalid={!!err("phone")} className={inputClass} />
                </Field>
                <Field label={t.address} hint={t.addressHint} error={err("address")}>
                  <input name="address" defaultValue={v.address} maxLength={200} autoComplete="street-address" placeholder={t.addressPlaceholder} aria-invalid={!!err("address")} className={inputClass} />
                </Field>
                <MapPicker latitude={v.latitude} longitude={v.longitude} texts={t} />
                {err("latitude") && <p className="text-sm text-error">{err("latitude")}</p>}
              </>
            );
          }}
        </Section>
      )}

      <Section title={t.passwordSection} hint={t.passwordNote} lang={lang} action={changePassword} dict={dict} submitLabel={t.changePassword} savedText={t.passwordChanged}>
        {(_state, err) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.currentPassword} error={err("currentPassword")}>
              <input name="currentPassword" type="password" autoComplete="current-password" aria-invalid={!!err("currentPassword")} className={inputClass} />
            </Field>
            <Field label={t.newPassword} hint={a.passwordHint} error={err("newPassword")}>
              <input name="newPassword" type="password" autoComplete="new-password" minLength={8} aria-invalid={!!err("newPassword")} className={inputClass} />
            </Field>
          </div>
        )}
      </Section>
    </div>
  );
}
