"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { createAdminResetLink } from "@/lib/auth/password-reset-actions";

/** "Make a reset link" for one user; the link is shown here once, to copy and hand over */
export function AdminResetLink({ lang, userId, hours, t }: { lang: Locale; userId: string; hours: number; t: Dictionary["admin"]["resetLink"] }) {
  const [state, action, pending] = useActionState(createAdminResetLink, undefined);
  // The link that was copied, so a newly made link shows "copy" again
  const [copiedLink, setCopiedLink] = useState<string>();

  return (
    <div className="w-full space-y-2 sm:w-auto">
      <form action={action}>
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="id" value={userId} />
        <button type="submit" disabled={pending} className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface-2">
          {t.create}
        </button>
      </form>
      {state?.error && (
        <p role="alert" className="text-sm text-error">
          {t.notAllowed}
        </p>
      )}
      {state?.link && (
        <div role="status" className="space-y-2 rounded-lg border border-line bg-surface-2 p-3 text-sm sm:max-w-md">
          <label className="block space-y-1">
            <span className="font-semibold">{t.label}</span>
            <input readOnly value={state.link} onFocus={(e) => e.target.select()} className="w-full rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs" />
          </label>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(state.link!).then(() => setCopiedLink(state.link))}
            className="rounded-md border border-line px-3 py-1 hover:bg-surface"
          >
            {copiedLink === state.link ? t.copied : t.copy}
          </button>
          <p className="text-muted">{t.hint.replace("{hours}", String(hours))}</p>
        </div>
      )}
    </div>
  );
}
