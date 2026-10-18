"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useActionState, useRef } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { deleteAccount, type AccountFormState } from "@/lib/auth/account-actions";

const danger = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-error px-5 py-2.5 font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/30 disabled:opacity-60";

/**
 * "Profili sil": a danger section on the profile page and a dialog that says what will happen and
 * asks for confirmation and the current password. The password is checked on the server only.
 */
export function DeleteAccount({ lang, dict, role }: { lang: Locale; dict: Dictionary; role: "SEEKER" | "EMPLOYER" }) {
  const d = dict.account.deleteProfile;
  const dialog = useRef<HTMLDialogElement>(null);
  // Called directly (no wrapper): after a successful delete the action redirects to the goodbye page
  const [state, action, pending] = useActionState<AccountFormState, FormData>(deleteAccount, undefined);
  const err = (field: string) => {
    const key = state?.errors[field];
    return key ? dict.auth.errors[key] : undefined;
  };

  return (
    <section className="rounded-xl border border-error/40 bg-surface p-5">
      <h2 className="text-lg font-semibold text-error">{d.title}</h2>
      <p className="mt-1 text-sm text-muted">{d.hint}</p>
      <button type="button" onClick={() => dialog.current?.showModal()} className={`${buttonClass.secondary} mt-4 hover:border-error hover:text-error`}>
        <Trash2 className="size-4" aria-hidden />
        {d.button}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="delete-title"
        onClick={(e) => e.target === dialog.current && !pending && dialog.current.close()}
        className="m-auto max-h-[90dvh] w-[min(94vw,480px)] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/40"
      >
        <form action={action} className="space-y-4 p-5 sm:p-6" noValidate>
          <input type="hidden" name="lang" value={lang} />
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-soft text-error">
              <AlertTriangle className="size-5" aria-hidden />
            </span>
            <div>
              <h3 id="delete-title" className="font-heading text-lg font-bold">
                {d.dialogTitle}
              </h3>
              <p className="text-sm font-semibold text-error">{d.irreversible}</p>
            </div>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {(role === "EMPLOYER" ? d.whatEmployer : d.whatSeeker).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {err("form") && (
            <p role="alert" className="rounded-xl bg-error-soft p-3 text-sm text-error">
              {err("form")}
            </p>
          )}
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">{d.password}</span>
            <input name="password" type="password" autoComplete="current-password" aria-invalid={!!err("password")} className={inputClass} />
            {err("password") && <span className="block text-sm text-error">{err("password")}</span>}
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input type="checkbox" name="confirm" className="mt-0.5 size-4 accent-error" aria-invalid={!!err("confirm")} />
            <span>{d.confirm}</span>
          </label>
          {err("confirm") && <p className="text-sm text-error">{err("confirm")}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button type="button" onClick={() => dialog.current?.close()} disabled={pending} autoFocus className={`${buttonClass.secondary} flex-1`}>
              {d.cancel}
            </button>
            <button type="submit" disabled={pending} className={`${danger} flex-1`}>
              <Trash2 className="size-4" aria-hidden />
              {pending ? d.deleting : d.submit}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
