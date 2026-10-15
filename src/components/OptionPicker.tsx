"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

type Group = { label: string; items: { value: string; label: string }[] };

/**
 * Searchable dropdown for a long grouped list (professions, skills). Single choice uses radio buttons,
 * multiple uses checkboxes; both are real form inputs named `name`, so the form submits them as is
 * and it still works without JavaScript (the list is then simply not filtered).
 */
export function OptionPicker({
  name,
  groups,
  multiple = false,
  defaultValues = [],
  max,
  placeholder,
  texts,
  invalid = false,
}: {
  name: string;
  groups: Group[];
  multiple?: boolean;
  defaultValues?: string[];
  /** Most items a multiple picker accepts; further boxes are disabled */
  max?: number;
  placeholder: string;
  texts: { search: string; noMatch: string; remove: string };
  invalid?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(defaultValues);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const labels = useMemo(() => new Map(groups.flatMap((g) => g.items.map((i) => [i.value, i.label]))), [groups]);
  const needle = query.trim().toLocaleLowerCase();
  const shown = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !needle || i.label.toLocaleLowerCase().includes(needle) || g.label.toLocaleLowerCase().includes(needle)) }))
    .filter((g) => g.items.length > 0);
  const full = multiple && max !== undefined && selected.length >= max;

  function toggle(value: string, checked: boolean) {
    if (!multiple) {
      setSelected([value]);
      setOpen(false);
      return;
    }
    setSelected((s) => (checked ? [...s, value] : s.filter((v) => v !== value)));
  }

  return (
    <div className="space-y-2">
      <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className="group rounded-xl">
        <summary
          className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl border bg-surface px-3.5 py-2.5 [&::-webkit-details-marker]:hidden ${
            invalid ? "border-error" : "border-line-strong"
          } group-open:border-accent group-open:ring-4 group-open:ring-accent/20`}
        >
          <span className={selected.length && !multiple ? "" : "text-muted"}>{!multiple && selected[0] ? labels.get(selected[0]) : placeholder}</span>
          <ChevronDown className="size-4 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-1.5 rounded-xl border border-line-strong bg-surface p-2 shadow-[0_12px_28px_rgba(23,32,51,0.12)]">
          <label className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 focus-within:ring-4 focus-within:ring-accent/20">
            <Search className="size-4 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={texts.search}
              aria-label={texts.search}
              className="min-w-0 flex-1 bg-transparent py-2 outline-none"
            />
          </label>
          <div className="mt-2 max-h-72 overflow-y-auto">
            {groups.map((g) => {
              const visible = shown.find((s) => s.label === g.label);
              return (
                // Hidden groups stay in the form so their checked inputs are still submitted
                <fieldset key={g.label} hidden={!visible} className="py-1">
                  <legend className="px-2 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-muted">{g.label}</legend>
                  {g.items.map((item) => {
                    const checked = selected.includes(item.value);
                    const hidden = !visible?.items.some((i) => i.value === item.value);
                    return (
                      <label
                        key={item.value}
                        hidden={hidden}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-surface-2 ${checked ? "font-semibold text-accent-ink" : ""} ${
                          full && !checked ? "cursor-not-allowed opacity-50" : ""
                        }`}
                      >
                        <input
                          type={multiple ? "checkbox" : "radio"}
                          name={name}
                          value={item.value}
                          checked={checked}
                          disabled={full && !checked}
                          onChange={(e) => toggle(item.value, e.target.checked)}
                          className="size-4 accent-accent"
                        />
                        {item.label}
                      </label>
                    );
                  })}
                </fieldset>
              );
            })}
            {shown.length === 0 && <p className="px-2 py-3 text-sm text-muted">{texts.noMatch}</p>}
          </div>
        </div>
      </details>
      {multiple && selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <li key={value}>
              <button
                type="button"
                onClick={() => toggle(value, false)}
                aria-label={`${texts.remove}: ${labels.get(value)}`}
                className="inline-flex items-center gap-1 rounded-full bg-accent-tint py-1 pl-3 pr-2 text-sm font-medium text-accent-ink hover:bg-accent-soft"
              >
                {labels.get(value)}
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
