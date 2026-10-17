"use client";

import { Check, X } from "lucide-react";
import { useActionState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { respondToOffer, type OfferFormState } from "@/lib/job-offer-actions";
import { OFFER_REPLY_MAX, type OfferErrorKey } from "@/lib/job-offers";

/** The job seeker's answer to an open offer: an optional message, then accept or decline. */
export function OfferReplyForm({ lang, dict, offerId }: { lang: Locale; dict: Dictionary; offerId: string }) {
  const o = dict.offers;
  const [state, action, pending] = useActionState<OfferFormState, FormData>(async (prev, formData) => {
    try {
      return await respondToOffer(offerId, prev, formData);
    } catch {
      return { errors: { form: "failed" }, values: { reply: String(formData.get("reply") ?? "") } };
    }
  }, undefined);
  const error = (field: string) => {
    const key = state?.errors[field];
    return key ? o.errors[key as OfferErrorKey] : undefined;
  };

  if (state?.sent) {
    return (
      <p role="status" className="text-sm font-semibold text-success">
        ✓ {o.answered}
      </p>
    );
  }

  return (
    <form key={JSON.stringify(state?.values ?? {})} action={action} className="space-y-3 border-t border-line pt-3" noValidate>
      <input type="hidden" name="lang" value={lang} />
      {(error("form") || error("decision")) && (
        <p role="alert" className="rounded-xl bg-error-soft p-3 text-sm text-error">
          {error("form") ?? error("decision")}
        </p>
      )}
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">{o.replyLabel}</span>
        <textarea
          name="reply"
          rows={2}
          maxLength={OFFER_REPLY_MAX}
          defaultValue={state?.values.reply ?? ""}
          placeholder={o.replyPlaceholder}
          aria-invalid={!!error("reply")}
          className={inputClass}
        />
        {error("reply") && <span className="block text-sm text-error">{error("reply")}</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" name="decision" value="ACCEPTED" disabled={pending} className={`${buttonClass.primary} flex-1 sm:flex-none`}>
          <Check className="size-4" aria-hidden />
          {o.accept}
        </button>
        <button type="submit" name="decision" value="DECLINED" disabled={pending} className={`${buttonClass.secondary} flex-1 hover:border-error hover:text-error sm:flex-none`}>
          <X className="size-4" aria-hidden />
          {o.decline}
        </button>
      </div>
    </form>
  );
}
