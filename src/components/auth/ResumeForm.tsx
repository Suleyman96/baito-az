"use client";

import { Download, Eye, FileText, Trash2, Upload } from "lucide-react";
import { useActionState, useState, type ChangeEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatFileSize, t } from "@/lib/format";
import { removeResume, uploadResume } from "@/lib/resume-actions";
import { MAX_RESUME_BYTES, RESUME_ACCEPT, resumeUrl } from "@/lib/resumes";
import { buttonClass } from "../ui";

type Resume = { id: string; fileName: string; size: number; uploadedOn: string } | null;

/**
 * The job seeker's CV: upload, replace, view, download, remove. Choosing a file uploads it right away.
 * Render with key={resume?.id}: after an upload the id changes and the form starts fresh.
 */
export function ResumeForm({ lang, dict, resume }: { lang: Locale; dict: Dictionary; resume: Resume }) {
  const [state, action, pending] = useActionState(uploadResume, undefined);
  const [clientError, setClientError] = useState<string | null>(null);
  const r = dict.resume;

  function choose(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setClientError(null);
    if (!file) return;
    // Early feedback only; the server checks the real file type and size again
    if (file.size > MAX_RESUME_BYTES) {
      e.target.value = "";
      return setClientError(r.errors.resumeTooLarge);
    }
    e.target.form?.requestSubmit();
  }

  const error = clientError ?? (state?.error ? r.errors[state.error] : null);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-lg font-semibold">{r.title}</h2>
      <p className="text-sm text-muted">{r.hint}</p>

      {resume ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-surface-2 p-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <FileText className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{resume.fileName}</span>
            <span className="text-sm text-muted">
              {formatFileSize(resume.size)} · {t(r.uploaded, { date: resume.uploadedOn })}
            </span>
          </span>
          <a href={resumeUrl(resume.id)} target="_blank" rel="noreferrer" className={buttonClass.secondary}>
            <Eye className="size-4" aria-hidden />
            {r.view}
          </a>
          <a href={resumeUrl(resume.id, true)} className={buttonClass.secondary}>
            <Download className="size-4" aria-hidden />
            {r.download}
          </a>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-line-strong p-4 text-sm text-muted">{r.none}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="lang" value={lang} />
          <label className={`${buttonClass.primary} cursor-pointer focus-within:ring-4 focus-within:ring-brand/30 ${pending ? "pointer-events-none opacity-60" : ""}`}>
            <Upload className="size-4" aria-hidden />
            {pending ? r.uploading : resume ? r.replace : r.upload}
            <input type="file" name="resume" accept={RESUME_ACCEPT} onChange={choose} disabled={pending} className="sr-only" />
          </label>
        </form>
        {resume && (
          <form action={removeResume}>
            <input type="hidden" name="lang" value={lang} />
            <button type="submit" className={`${buttonClass.secondary} hover:border-red-500 hover:text-red-600`}>
              <Trash2 className="size-4" aria-hidden />
              {r.remove}
            </button>
          </form>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
