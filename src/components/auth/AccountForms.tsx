"use client";

import { useActionState, type ReactNode } from "react";
import { MapPicker } from "@/components/maps/MapPicker";
import { SocialLinksFields } from "@/components/SocialLinksFields";
import { buttonClass, Field, inputClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { changePassword, updateAccount, updateCompany, type AccountFormState } from "@/lib/auth/account-actions";
import type { SocialKind } from "@/lib/social-links";
import { MAX_EMAIL_LENGTH, NAME_CHARS, PHONE_CHARS } from "@/lib/validation-rules";
import { useLiveValidation } from "../forms/useLiveValidation";



/** One profile section: its own form, action and "saved" message. */
function Section({
  id,
  title,
  hint,
  lang,
  action,
  dict,
  submitLabel,
  savedText,
  children,
}: {
  /** Anchor for links to this section (e.g. the email reminder) */
  id?: string;
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
  const live = useLiveValidation(state, dict.validation.required);
  const err = (field: string) => {
    const key = state?.errors[field];
    return live.error(field, key ? dict.auth.errors[key] : undefined);
  };

  return (
    <section id={id} className="scroll-mt-24 rounded-xl border border-line bg-surface p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {/* key: React resets uncontrolled fields after an action; remounting with the returned values keeps them */}
      <form key={JSON.stringify(state?.values ?? {})} action={formAction} className="mt-4 space-y-4" {...live.formProps}>
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
  company?: { name: string; description: string; phone: string; address: string; latitude: string; longitude: string } & Partial<Record<SocialKind, string>>;
}) {
  const t = dict.account;
  // "Up to 1000 characters", shown under long text fields
  const limit = (max: number) => dict.validation.maxChars.replace("{max}", String(max));
  const a = dict.auth;

  return (
    <div className="space-y-4">
      <Section id="account-details" title={t.accountSection} hint={a.contactHint} lang={lang} action={updateAccount} dict={dict} submitLabel={t.save} savedText={t.saved}>
        {(state, err) => {
          const v = state?.values ?? user;
          return (
            <>
              <Field label={a.name} error={err("name")} required>
                <input
                  name="name"
                  defaultValue={v.name}
                  autoComplete="name"
                  required
                  maxLength={80}
                  data-check="name"
                  data-allow={NAME_CHARS}
                  data-error={a.errors.nameInvalid}
                  aria-invalid={!!err("name")}
                  className={inputClass}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={a.phone} hint={a.phoneHint} error={err("phone")}>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    defaultValue={v.phone}
                    autoComplete="tel"
                    maxLength={20}
                    data-check="phone"
                    data-allow={PHONE_CHARS}
                    data-error={a.errors.phoneInvalid}
                    aria-invalid={!!err("phone")}
                    className={inputClass}
                  />
                </Field>
                <Field label={a.email} error={err("email")}>
                  <input
                    name="email"
                    type="email"
                    inputMode="email"
                    defaultValue={v.email}
                    autoComplete="email"
                    maxLength={MAX_EMAIL_LENGTH}
                    data-check="email"
                    data-error={a.errors.emailInvalid}
                    aria-invalid={!!err("email")}
                    className={inputClass}
                  />
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
              instagram: company.instagram,
              facebook: company.facebook,
              tiktok: company.tiktok,
              whatsapp: company.whatsapp,
              telegram: company.telegram,
            };
            return (
              <>
                <Field label={a.companyName} hint={a.companyHint} error={err("companyName")}>
                  <input
                    name="companyName"
                    defaultValue={v.companyName}
                    autoComplete="organization"
                    maxLength={100}
                    data-check="company"
                    data-error={a.errors.companyNameInvalid}
                    aria-invalid={!!err("companyName")}
                    className={inputClass}
                  />
                </Field>
                <Field label={t.description} hint={limit(1000)} error={err("description")}>
                  <textarea name="description" rows={3} maxLength={1000} defaultValue={v.description} placeholder={t.descriptionPlaceholder} aria-invalid={!!err("description")} className={inputClass} />
                </Field>
                <Field label={t.companyPhone} hint={t.companyPhoneHint} error={err("phone")}>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    defaultValue={v.phone}
                    maxLength={20}
                    data-check="phone"
                    data-allow={PHONE_CHARS}
                    data-error={a.errors.phoneInvalid}
                    aria-invalid={!!err("phone")}
                    className={inputClass}
                  />
                </Field>
                <Field label={t.address} hint={t.addressHint} error={err("address")}>
                  <input name="address" defaultValue={v.address} maxLength={200} autoComplete="street-address" placeholder={t.addressPlaceholder} aria-invalid={!!err("address")} className={inputClass} />
                </Field>
                <MapPicker latitude={v.latitude} longitude={v.longitude} texts={t} />
                {err("latitude") && <p className="text-sm text-error">{err("latitude")}</p>}
                <h3 className="pt-2 font-semibold">{dict.social.title}</h3>
                <SocialLinksFields dict={dict} values={v} errors={state?.errors} />
              </>
            );
          }}
        </Section>
      )}

      <Section title={t.passwordSection} hint={t.passwordNote} lang={lang} action={changePassword} dict={dict} submitLabel={t.changePassword} savedText={t.passwordChanged}>
        {(_state, err) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.currentPassword} error={err("currentPassword")} required>
              <input name="currentPassword" type="password" autoComplete="current-password" required aria-invalid={!!err("currentPassword")} className={inputClass} />
            </Field>
            <Field label={t.newPassword} hint={a.passwordHint} error={err("newPassword")} required>
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                data-check="password"
                data-error={a.passwordHint}
                aria-invalid={!!err("newPassword")}
                className={inputClass}
              />
            </Field>
          </div>
        )}
      </Section>
    </div>
  );
}
