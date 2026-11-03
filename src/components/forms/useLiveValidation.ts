"use client";

import { useState, type FocusEvent, type FormEvent } from "react";
import { EMAIL, isCompanyName, isJobTitle, isPersonName, normalizePhone, parseAmount, passwordProblem } from "@/lib/validation-rules";

// Live checks for a form, in the browser, on top of the server's (which still decide). A field is checked
// when the user leaves it; while they type, a shown error is updated and disappears as soon as the value
// is valid, which also hides the server's error for that field. Sending a form with invalid fields is
// stopped, and the first one gets the focus.
//
// Fields use the HTML rules (required, type="email", minLength, maxLength, min, max) plus:
// - data-check: a rule of validation-rules.ts, the same one the server uses (see CHECKS)
// - data-error: the message for an invalid value
// - data-required: the message for an empty required field, when the general "fill in this field" does not fit
//   (e.g. the terms checkbox)
// - data-allow: the characters that may be typed, as a regex class; anything else is dropped as it is typed

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

// Each passes an empty value: whether a field may be empty is up to "required"
const CHECKS: Record<string, (value: string) => boolean> = {
  name: (v) => !v.trim() || isPersonName(v),
  company: (v) => !v.trim() || isCompanyName(v),
  jobTitle: (v) => !v.trim() || isJobTitle(v),
  phone: (v) => !v.trim() || normalizePhone(v) !== null,
  email: (v) => !v.trim() || EMAIL.test(v.trim()),
  amount: (v) => parseAmount(v) !== undefined,
  password: (v) => !v || passwordProblem(v) === null,
};

const isControl = (el: EventTarget): el is Control =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;

/** Fields hidden on the page (e.g. the other job type's section) are not the user's to fill in */
const checkable = (el: Control) => el.name !== "" && el.type !== "hidden" && !el.disabled && el.getClientRects().length > 0;

/** The message for a field's current value, or null when it is fine */
function problem(el: Control, required: string): string | null {
  const check = el.dataset.check && CHECKS[el.dataset.check];
  if (check) el.setCustomValidity(check(el.value) ? "" : "invalid");
  if (el.validity.valid) return null;
  if (el.validity.valueMissing) return el.dataset.required ?? required;
  return el.dataset.error ?? required;
}

/** Drops characters the field does not take (data-allow), keeping the caret where it was */
function filterTyped(el: Control) {
  const allow = el.dataset.allow;
  if (!allow || !(el instanceof HTMLInputElement)) return;
  const kept = el.value.replace(new RegExp(`[^${allow}]`, "gu"), "");
  if (kept === el.value) return;
  const caret = (el.selectionStart ?? el.value.length) - (el.value.length - kept.length);
  el.value = kept;
  el.setSelectionRange(Math.max(caret, 0), Math.max(caret, 0));
}

/**
 * `reset` is the form's last server result: a new one starts the checks over, so its errors show.
 * `error(field, serverError)` gives what to show under a field.
 */
export function useLiveValidation(reset: unknown, required: string) {
  const [shown, setShown] = useState<Record<string, string | null>>({});
  const [result, setResult] = useState(reset);
  if (result !== reset) {
    setResult(reset);
    setShown({});
  }
  const show = (name: string, message: string | null) => setShown((s) => (s[name] === message && name in s ? s : { ...s, [name]: message }));

  return {
    error: (field: string, serverError?: string) => (field in shown ? (shown[field] ?? undefined) : serverError),
    formProps: {
      // The browser's own bubbles are replaced by the messages under the fields
      noValidate: true,
      onBlur(e: FocusEvent<HTMLFormElement>) {
        if (isControl(e.target) && checkable(e.target)) show(e.target.name, problem(e.target, required));
      },
      onInput(e: FormEvent<HTMLFormElement>) {
        const el = e.target;
        if (!isControl(el)) return;
        // Not while an input method (e.g. Japanese) is still composing the text
        if (!(e.nativeEvent as InputEvent).isComposing) filterTyped(el);
        if (!checkable(el)) return;
        const message = problem(el, required);
        // While typing: errors already shown follow the value; new ones wait until the field is left
        if (message === null || el.name in shown) show(el.name, message);
      },
      onSubmit(e: FormEvent<HTMLFormElement>) {
        const invalid: [Control, string][] = [];
        for (const el of Array.from(e.currentTarget.elements)) {
          if (!isControl(el) || !checkable(el)) continue;
          const message = problem(el, required);
          if (message) invalid.push([el, message]);
        }
        if (invalid.length === 0) return;
        e.preventDefault();
        setShown((s) => ({ ...s, ...Object.fromEntries(invalid.map(([el, m]) => [el.name, m])) }));
        invalid[0][0].focus();
      },
    },
  };
}
