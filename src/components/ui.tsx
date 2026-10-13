import type { ReactNode } from "react";

// Shared look for form controls and buttons, so every form on the site matches

/** Text inputs, selects and textareas */
export const inputClass =
  "w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-base outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15 aria-invalid:border-error aria-invalid:focus:ring-error/15";

export const buttonClass = {
  primary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-on-brand transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30 disabled:opacity-60",
  secondary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2 font-medium transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20",
};

/** Label + control + hint or error. Clicking the label focuses the control. */
export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {error ? (
        <span className="block text-sm text-error">{error}</span>
      ) : (
        hint && <span className="block text-xs text-muted">{hint}</span>
      )}
    </label>
  );
}

/** White rounded panel used for forms and lists */
export const cardClass = "rounded-2xl border border-line bg-surface shadow-[0_4px_14px_rgba(23,32,51,0.06)]";
