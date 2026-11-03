"use client";

import { useActionState } from "react";
import { Field, inputClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { reactivateJob } from "@/lib/job-actions";

/**
 * "Reactivate" on an archived job. Full-time / part-time: one button, a new month starts.
 * One-day: a new work date and time (the old one has usually passed) and an optional end date.
 */
export function ReactivateJob({
  lang,
  jobId,
  oneDay,
  today,
  initial,
  dict,
  buttonClassName,
}: {
  lang: Locale;
  jobId: string;
  oneDay: boolean;
  today: string;
  /** One-day: the current work date and time, as the form shows them */
  initial?: { workDate: string; startTime: string };
  dict: Dictionary;
  buttonClassName: string;
}) {
  const [state, action, pending] = useActionState(reactivateJob, undefined);
  const t = dict.myJobs;
  const errors = dict.postJob.errors;
  const err = (field: "workDate" | "endDate") => {
    const key = state?.errors[field];
    return key ? errors[key] : undefined;
  };
  const hidden = (
    <>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="id" value={jobId} />
    </>
  );

  if (!oneDay) {
    return (
      <form action={action}>
        {hidden}
        <button disabled={pending} className={buttonClassName} title={t.reactivateNote}>
          {t.reactivate}
        </button>
      </form>
    );
  }

  const v = state?.values ?? { ...initial, endDate: "" };
  return (
    // Open again after a failed try, so the errors are visible
    <details open={!!state} className="w-full">
      <summary className={`${buttonClassName} inline-block cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>{t.reactivate}</summary>
      <form action={action} className="mt-3 space-y-3 rounded-xl border border-line p-3">
        {hidden}
        <p className="text-sm text-muted">{t.reactivateOneDayNote}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={dict.postJob.workDate} error={err("workDate")}>
            <input type="date" name="workDate" min={today} defaultValue={v.workDate} required aria-invalid={!!err("workDate")} className={inputClass} />
          </Field>
          <Field label={dict.postJob.startTime}>
            <input type="time" name="startTime" defaultValue={v.startTime} required className={inputClass} />
          </Field>
          <Field label={dict.postJob.endDate} error={err("endDate")}>
            <input type="date" name="endDate" min={today} defaultValue={v.endDate} aria-invalid={!!err("endDate")} className={inputClass} />
          </Field>
        </div>
        <p className="text-xs text-muted">{dict.postJob.endDateNote}</p>
        <button disabled={pending} className={buttonClassName}>
          {t.reactivateSubmit}
        </button>
      </form>
    </details>
  );
}
