"use client";

import { CheckCircle2, Star } from "lucide-react";
import { useActionState, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/lib/format";
import { submitReview, type ReviewFormState } from "@/lib/review-actions";
import { useLiveValidation } from "../forms/useLiveValidation";
import { buttonClass, inputClass } from "../ui";

/**
 * Star rating + comment for one person on one completed job. The stars are a radio group,
 * so they work with the keyboard (arrow keys) and without JavaScript.
 */
export function ReviewForm({ lang, dict, jobId, subjectId }: { lang: Locale; dict: Dictionary; jobId: string; subjectId: string }) {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(submitReview.bind(null, jobId, subjectId), undefined);
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(Number(state?.values?.rating) || 0);
  const r = dict.reviews;
  const live = useLiveValidation(state, dict.validation.required);

  if (state?.saved) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-xl bg-success-soft p-3 text-sm font-medium text-success">
        <CheckCircle2 className="size-4" aria-hidden />
        {r.saved}
      </p>
    );
  }

  const shown = hover || rating;
  return (
    <form action={action} className="space-y-3" {...live.formProps}>
      <input type="hidden" name="lang" value={lang} />
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">{r.rateLabel}</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} onMouseEnter={() => setHover(n)} className="cursor-pointer rounded-md p-0.5 has-focus-visible:ring-4 has-focus-visible:ring-accent/25">
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                required
                data-required={r.errors.ratingInvalid}
                className="sr-only"
              />
              <Star className={`size-7 transition ${n <= shown ? "fill-accent text-accent" : "text-line-strong"}`} aria-hidden />
              <span className="sr-only">{t(r.star, { count: n })}</span>
            </label>
          ))}
        </div>
        {live.error("rating") && <p className="mt-1 text-sm text-error">{live.error("rating")}</p>}
      </fieldset>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">
          {r.commentLabel}
          <span className="text-error" aria-hidden>
            {" "}
            *
          </span>
        </span>
        <textarea
          name="comment"
          rows={3}
          required
          minLength={5}
          maxLength={1000}
          defaultValue={state?.values?.comment}
          placeholder={r.commentPlaceholder}
          data-error={r.errors.commentShort}
          aria-invalid={!!live.error("comment")}
          className={inputClass}
        />
        {live.error("comment") ? (
          <span className="block text-sm text-error">{live.error("comment")}</span>
        ) : (
          <span className="block text-xs text-muted">{dict.validation.maxChars.replace("{max}", "1000")}</span>
        )}
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-error">
          {r.errors[state.error]}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass.primary}>
        {pending ? r.sending : r.submit}
      </button>
    </form>
  );
}
