"use client";

import { useActionState, useState } from "react";
import { Field, inputClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { reactivateJob } from "@/lib/job-actions";
import { useLiveValidation } from "./forms/useLiveValidation";

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
  // The end date cannot be before the work date, so the date picker starts there (checked on the server too)
  const [workDate, setWorkDate] = useState<string>();
  const live = useLiveValidation(state, dict.validation.required);
  const t = dict.myJobs;
  const errors = dict.postJob.errors;
  const err = (field: "workDate" | "startTime" | "endDate") => {
    const key = field === "startTime" ? undefined : state?.errors[field];
    return live.error(field, key ? errors[key] : undefined);
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
      <form action={action} className="mt-3 space-y-3 rounded-xl border border-line p-3" {...live.formProps}>
        {hidden}
        <p className="text-sm text-muted">{t.reactivateOneDayNote}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={dict.postJob.workDate} error={err("workDate")} required>
            <input
              type="date"
              name="workDate"
              min={today}
              defaultValue={v.workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              required
              data-required={errors.dateRequired}
              data-error={errors.dateInPast}
              aria-invalid={!!err("workDate")}
              className={inputClass}
            />
          </Field>
          <Field label={dict.postJob.startTime} error={err("startTime")} required>
            <input type="time" name="startTime" defaultValue={v.startTime} required data-required={errors.dateRequired} aria-invalid={!!err("startTime")} className={inputClass} />
          </Field>
          <Field label={dict.postJob.endDate} error={err("endDate")}>
            <input
              type="date"
              name="endDate"
              min={workDate || v.workDate || today}
              defaultValue={v.endDate}
              data-error={errors.endDateBeforeWork}
              aria-invalid={!!err("endDate")}
              className={inputClass}
            />
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
