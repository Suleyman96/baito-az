import type { Dictionary } from "@/i18n/dictionaries";
import { SOCIAL_KINDS, type SocialKind } from "@/lib/social-links";
import { SocialIcon } from "./SocialIcons";
import { inputClass } from "./ui";

/**
 * The five optional social link inputs, used inside the worker profile and company forms
 * (each form's own action saves them). `errors` holds the raw keys the action returned.
 */
export function SocialLinksFields({
  dict,
  values,
  errors,
}: {
  dict: Dictionary;
  values: Partial<Record<SocialKind, string>>;
  errors?: Partial<Record<string, string>>;
}) {
  const s = dict.social;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{s.hint}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {SOCIAL_KINDS.map((kind) => {
          const error = errors?.[kind] ? s.errors[kind] : undefined;
          const hint = kind === "whatsapp" ? s.whatsappHint : undefined;
          return (
            <label key={kind} className="block space-y-1.5">
              <span className="text-sm font-semibold">{s.names[kind]}</span>
              <span className="relative block">
                <SocialIcon kind={kind} className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted" />
                <input
                  name={kind}
                  type={kind === "whatsapp" ? "tel" : "text"}
                  inputMode={kind === "whatsapp" ? "tel" : "url"}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={200}
                  defaultValue={values[kind] ?? ""}
                  placeholder={s.placeholders[kind]}
                  aria-invalid={!!error}
                  className={`${inputClass} pl-10`}
                />
              </span>
              {error ? <span className="block text-sm text-error">{error}</span> : hint && <span className="block text-xs text-muted">{hint}</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
}
