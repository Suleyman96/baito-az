"use client";

import { CheckCircle2, Send, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, type ReactNode } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/lib/format";
import { sendJobOffer, type OfferFormState } from "@/lib/job-offer-actions";
import { OFFER_MESSAGE_MAX, type OfferErrorKey } from "@/lib/job-offers";

type Viewer = "guest" | "employer" | "other";

/**
 * "Müraciət et" on a job seeker's public profile: a dialog with the two ways to reach them —
 * an offer sent through the site (employers only) and the social links the seeker made public.
 */
export function ContactWorker({
  lang,
  dict,
  workerId,
  workerName,
  viewer,
  jobs,
  loginHref,
  social,
}: {
  lang: Locale;
  dict: Dictionary;
  workerId: string;
  workerName: string;
  viewer: Viewer;
  jobs: { id: string; title: string }[];
  loginHref: string;
  /** The seeker's public social buttons, or null when they have none */
  social: ReactNode;
}) {
  const o = dict.offers;
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={`${buttonClass.primary} w-full sm:w-auto`}>
        <Send className="size-4" aria-hidden />
        {o.button}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="contact-title"
        // Clicking the dimmed area outside the box closes it
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto max-h-[90dvh] w-[min(94vw,520px)] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/40"
      >
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="contact-title" className="font-heading text-xl font-bold">
              {t(o.dialogTitle, { name: workerName })}
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={o.close}
              className="-m-1 rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <section className="space-y-3">
            <h3 className="font-semibold">{o.siteTitle}</h3>
            {viewer === "employer" ? (
              <OfferForm lang={lang} dict={dict} workerId={workerId} jobs={jobs} />
            ) : viewer === "guest" ? (
              <div className="space-y-3 rounded-xl bg-surface-2 p-4 text-sm">
                <p className="text-muted">{o.guestText}</p>
                <Link href={loginHref} className={buttonClass.secondary}>
                  {o.login}
                </Link>
              </div>
            ) : (
              <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">{o.othersText}</p>
            )}
          </section>

          {social && (
            <section className="space-y-3 border-t border-line pt-5">
              <div>
                <h3 className="font-semibold">{o.socialTitle}</h3>
                <p className="text-sm text-muted">{o.socialHint}</p>
              </div>
              {social}
            </section>
          )}
        </div>
      </dialog>
    </>
  );
}

function OfferForm({ lang, dict, workerId, jobs }: { lang: Locale; dict: Dictionary; workerId: string; jobs: { id: string; title: string }[] }) {
  const o = dict.offers;
  const [state, action, pending] = useActionState<OfferFormState, FormData>(async (prev, formData) => {
    try {
      return await sendJobOffer(workerId, prev, formData);
    } catch {
      // Network or server failure: keep what was typed and say so
      return { errors: { form: "failed" }, values: { message: String(formData.get("message") ?? ""), jobId: String(formData.get("jobId") ?? "") } };
    }
  }, undefined);
  const error = (field: string) => {
    const key = state?.errors[field];
    return key ? o.errors[key as OfferErrorKey] : undefined;
  };

  if (state?.sent) {
    return (
      <div role="status" className="space-y-3 rounded-xl bg-success-soft p-4 text-sm text-success">
        <p className="flex items-start gap-2 font-semibold">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          {o.sent}
        </p>
        <Link href={`/${lang}/my/offers`} className="font-semibold underline">
          {o.viewSent}
        </Link>
      </div>
    );
  }

  const v = state?.values ?? {};
  return (
    <form key={JSON.stringify(v)} action={action} className="space-y-3" noValidate>
      <p className="text-sm text-muted">{o.siteHint}</p>
      {error("form") && (
        <p role="alert" className="rounded-xl bg-error-soft p-3 text-sm text-error">
          {error("form")}
        </p>
      )}
      {jobs.length > 0 && (
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">{o.job}</span>
          <select name="jobId" defaultValue={v.jobId ?? ""} aria-invalid={!!error("jobId")} className={inputClass}>
            <option value="">{o.noJob}</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          {error("jobId") && <span className="block text-sm text-error">{error("jobId")}</span>}
        </label>
      )}
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">{o.message}</span>
        <textarea
          name="message"
          rows={4}
          maxLength={OFFER_MESSAGE_MAX}
          defaultValue={v.message ?? ""}
          placeholder={o.messagePlaceholder}
          aria-invalid={!!error("message")}
          className={inputClass}
        />
        {error("message") && <span className="block text-sm text-error">{error("message")}</span>}
      </label>
      <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
        <Send className="size-4" aria-hidden />
        {pending ? o.sending : o.send}
      </button>
    </form>
  );
}
