"use client";

import { CheckCircle2, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { applyToJob, type ApplyState } from "@/lib/application-actions";
import { t } from "@/lib/format";
import { buttonClass, inputClass } from "./ui";

/** Apply form on a job page for a logged-in job seeker who has not applied yet. */
export function ApplyPanel({
  lang,
  dict,
  jobId,
  resumeFile,
  resumeRequired,
}: {
  lang: Locale;
  dict: Dictionary;
  jobId: string;
  /** File name of the seeker's current CV, or null */
  resumeFile: string | null;
  resumeRequired: boolean;
}) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyToJob.bind(null, jobId), undefined);
  const a = dict.apply;

  // After a successful apply the page refreshes into the "already applied" card; this covers the moment between
  if (state?.applied) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-xl bg-brand-soft p-3 text-sm font-medium text-brand-strong">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        {a.success}
      </p>
    );
  }

  const blocked = resumeRequired && !resumeFile;

  return (
    <form id="apply" action={action} className="space-y-3">
      <input type="hidden" name="lang" value={lang} />
      {resumeFile ? (
        <p className="flex items-start gap-2 text-sm text-muted">
          <FileText className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          {t(a.withResume, { file: resumeFile })}
        </p>
      ) : (
        <div className={`space-y-2 rounded-xl p-3 text-sm ${blocked ? "bg-accent-soft text-accent-ink" : "bg-surface-2 text-muted"}`}>
          <p>{blocked ? a.resumeRequired : a.withoutResume}</p>
          <Link href={`/${lang}/account#resume`} className="inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline">
            <Upload className="size-4" aria-hidden />
            {a.uploadResume}
          </Link>
        </div>
      )}
      {!blocked && (
        <>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">{a.messageLabel}</span>
            <textarea name="message" rows={3} maxLength={1000} defaultValue={state?.message} placeholder={a.messagePlaceholder} className={inputClass} />
          </label>
          <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
            {pending ? a.sending : a.submit}
          </button>
        </>
      )}
      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {a.errors[state.error]}
        </p>
      )}
    </form>
  );
}
