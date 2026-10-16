"use client";

import { useActionState, useState, type ReactNode } from "react";
import { AGE_RANGES } from "@/config/professions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { MAX_JOB_IMAGES } from "@/lib/images";
import { t } from "@/lib/format";
import { saveWorkerProfile, type WorkerProfileState } from "@/lib/worker-profile-actions";
import { MAX_EXTRA_PROFESSIONS, MAX_SKILLS, NEGOTIABLE } from "@/lib/worker-profile";
import { ImagesField } from "./ImagesField";
import { LocationSelect } from "./LocationSelect";
import { OptionPicker } from "./OptionPicker";
import { buttonClass, Field, inputClass } from "./ui";

type PickerGroup = { label: string; items: { value: string; label: string }[] };
type District = { id: number; slug: string; label: string; locations: { id: number; name: string }[] };

const WORK_TYPES = ["FULL_TIME", "PART_TIME", "ONE_DAY"] as const;
/** Choice buttons in the work-preferences section, as tall as the inputs beside them */
const tallChoice = "min-h-11.5";
const choice = "flex cursor-pointer items-center gap-2 rounded-xl border border-line-strong px-3 py-2.5 text-sm has-checked:border-accent has-checked:bg-accent-tint has-checked:font-semibold";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-heading text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Expected pay: amount + how it is counted, or "negotiable", which removes the amount field
 * (nothing is submitted for it, so the server stores no amount) and explains what that means.
 */
function ExpectedPayField({ dict, amount, period, error }: { dict: Dictionary; amount: string; period: string; error?: string }) {
  const p = dict.workerProfile;
  const [current, setCurrent] = useState(period);
  const negotiable = current === NEGOTIABLE;
  return (
    <div className="space-y-1.5">
      <label htmlFor={negotiable ? "expectedPayPeriod" : "expectedPay"} className="block text-sm font-semibold">
        {p.expectedPay}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {!negotiable && (
          <input
            id="expectedPay"
            name="expectedPay"
            type="number"
            min={1}
            inputMode="numeric"
            defaultValue={amount}
            aria-invalid={!!error}
            className={`${inputClass} min-h-11.5`}
          />
        )}
        <select
          id="expectedPayPeriod"
          name="expectedPayPeriod"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          aria-label={dict.postJob.payType}
          aria-describedby={negotiable ? "expectedPayNote" : undefined}
          className={`${inputClass} min-h-11.5 min-w-0 whitespace-nowrap ${negotiable ? "col-span-2" : ""}`}
        >
          <option value="MONTH">{dict.postJob.payMonth}</option>
          <option value="DAY">{dict.postJob.payDay}</option>
          <option value="HOUR">{dict.postJob.payHour}</option>
          <option value={NEGOTIABLE}>{dict.workers.negotiable}</option>
        </select>
      </div>
      {error ? (
        <span className="block text-sm text-error">{error}</span>
      ) : (
        negotiable && (
          <span id="expectedPayNote" className="block text-sm text-info">
            {p.payNegotiableNote}
          </span>
        )
      )}
    </div>
  );
}

/** The job seeker's work profile. Values come back after a server error, so nothing typed is lost. */
export function WorkerProfileForm({
  lang,
  dict,
  initial,
  professions,
  skills,
  districts,
  portfolio,
  today,
}: {
  lang: Locale;
  dict: Dictionary;
  initial: Record<string, string | string[]>;
  professions: PickerGroup[];
  skills: PickerGroup[];
  districts: District[];
  portfolio: string[];
  today: string;
}) {
  const [state, action, pending] = useActionState<WorkerProfileState, FormData>(saveWorkerProfile, undefined);
  // Portfolio files live outside the <form> (which remounts after an error), as in the job form
  const [files, setFiles] = useState<File[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  // After a successful save the chosen files are uploaded: clear them so a second save does not send them again
  // (state adjusted during render, React's documented pattern for reacting to a changed value)
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state?.saved) {
      setFiles([]);
      setRemoved([]);
    }
  }
  const p = dict.workerProfile;
  const v = state?.values ?? initial;
  const one = (k: string) => (Array.isArray(v[k]) ? (v[k] as string[])[0] : (v[k] as string | undefined)) ?? "";
  const many = (k: string) => (Array.isArray(v[k]) ? (v[k] as string[]) : v[k] ? [v[k] as string] : []);
  const err = (field: string) => {
    const key = state?.errors[field];
    if (!key) return undefined;
    return key in p.errors ? p.errors[key as keyof typeof p.errors] : t(dict.upload[key as keyof typeof dict.upload], { max: MAX_JOB_IMAGES });
  };
  const hasErrors = !!state && Object.keys(state.errors).length > 0;
  const pickerTexts = { search: p.search, noMatch: p.noMatch, remove: dict.upload.removeImage };
  const checked = (k: string, fallback = false) => (k in v ? one(k) === "on" || one(k) === "true" : fallback);

  return (
    <form key={JSON.stringify(state?.values ?? {})} action={action} className="space-y-4" noValidate>
      <input type="hidden" name="lang" value={lang} />

      <Section title={p.personal}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={p.name} error={err("name")}>
            <input name="name" defaultValue={one("name")} autoComplete="name" aria-invalid={!!err("name")} className={inputClass} />
          </Field>
          <Field label={p.phone} hint={p.phoneHint} error={err("phone")}>
            <input name="phone" type="tel" inputMode="tel" defaultValue={one("phone")} autoComplete="tel" aria-invalid={!!err("phone")} className={inputClass} />
          </Field>
          <Field label={p.ageRange}>
            <select name="ageRange" defaultValue={one("ageRange")} className={inputClass}>
              <option value="">{p.ageNone}</option>
              {AGE_RANGES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={p.bio} error={err("bio")}>
          <textarea name="bio" rows={3} maxLength={500} defaultValue={one("bio")} placeholder={p.bioPlaceholder} className={inputClass} />
        </Field>
      </Section>

      <Section title={p.profession}>
        <div className="space-y-1.5">
          <span className="text-sm font-semibold">{p.primaryProfession}</span>
          <OptionPicker name="primaryProfession" groups={professions} defaultValues={many("primaryProfession")} placeholder={p.choose} texts={pickerTexts} invalid={!!err("primaryProfession")} />
          {err("primaryProfession") && <span className="block text-sm text-error">{err("primaryProfession")}</span>}
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-semibold">{p.additionalProfessions}</span>
          <OptionPicker name="additionalProfessions" multiple max={MAX_EXTRA_PROFESSIONS} groups={professions} defaultValues={many("additionalProfessions")} placeholder={p.choose} texts={pickerTexts} />
          {err("additionalProfessions") && <span className="block text-sm text-error">{err("additionalProfessions")}</span>}
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-semibold">{p.skills}</span>
          <OptionPicker name="skills" multiple max={MAX_SKILLS} groups={skills} defaultValues={many("skills")} placeholder={p.choose} texts={pickerTexts} />
          {err("skills") && <span className="block text-sm text-error">{err("skills")}</span>}
        </div>
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <Field label={p.experienceYears} error={err("experienceYears")}>
            <input name="experienceYears" type="number" min={0} max={60} inputMode="numeric" defaultValue={one("experienceYears")} aria-invalid={!!err("experienceYears")} className={inputClass} />
          </Field>
        </div>
        <Field label={p.workHistory} error={err("workHistory")}>
          <textarea name="workHistory" rows={3} maxLength={2000} defaultValue={one("workHistory")} placeholder={p.workHistoryPlaceholder} className={inputClass} />
        </Field>
        <Field label={p.certificates} error={err("certificates")}>
          <textarea name="certificates" rows={2} maxLength={1000} defaultValue={one("certificates")} placeholder={p.certificatesPlaceholder} className={inputClass} />
        </Field>
      </Section>

      <Section title={p.location}>
        <div className="space-y-1.5">
          <span className="text-sm font-semibold">
            {p.district} / {p.village}
          </span>
          <div className="grid gap-2 sm:grid-cols-2">
            <LocationSelect
              districts={districts}
              district={one("district") || undefined}
              location={one("locationId") ? Number(one("locationId")) : undefined}
              labels={{ allDistricts: dict.postJob.chooseDistrict, allVillages: dict.postJob.chooseVillage }}
              villageName="locationId"
              className={inputClass}
            />
          </div>
          {(err("district") ?? err("locationId")) && <span className="block text-sm text-error">{err("district") ?? err("locationId")}</span>}
        </div>
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-semibold">{p.preferredDistricts}</legend>
          <div className="flex flex-wrap gap-2">
            {districts.map((d) => (
              <label key={d.slug} className={choice}>
                <input type="checkbox" name="preferredDistricts" value={d.slug} defaultChecked={many("preferredDistricts").includes(d.slug)} className="size-4 accent-accent" />
                {d.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={p.maxCommuteKm} error={err("maxCommuteKm")}>
            <input name="maxCommuteKm" type="number" min={0} max={300} inputMode="numeric" defaultValue={one("maxCommuteKm")} aria-invalid={!!err("maxCommuteKm")} className={inputClass} />
          </Field>
          <label className={`${choice} self-end`}>
            <input type="checkbox" name="willingToRelocate" defaultChecked={checked("willingToRelocate")} className="size-4 accent-accent" />
            {p.willingToRelocate}
          </label>
        </div>
      </Section>

      <Section title={p.preferences}>
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-semibold">{p.workTypes}</legend>
          <div className="flex flex-wrap gap-2">
            {WORK_TYPES.map((type) => (
              <label key={type} className={`${choice} ${tallChoice}`}>
                <input type="checkbox" name="workTypes" value={type} defaultChecked={many("workTypes").includes(type)} className="size-4 accent-accent" />
                {dict.jobType[type]}
              </label>
            ))}
          </div>
          {err("workTypes") && <span className="block text-sm text-error">{err("workTypes")}</span>}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={p.availableFrom} error={err("availableFrom")}>
            <input name="availableFrom" type="date" min={today} defaultValue={one("availableFrom")} aria-invalid={!!err("availableFrom")} className={inputClass} />
          </Field>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-semibold">{p.availability}</legend>
            <div className="flex flex-wrap gap-2">
              <label className={`${choice} ${tallChoice} flex-auto whitespace-nowrap`}>
                <input type="checkbox" name="availableWeekdays" defaultChecked={checked("availableWeekdays", true)} className="size-4 accent-accent" />
                {p.weekdays}
              </label>
              <label className={`${choice} ${tallChoice} flex-auto whitespace-nowrap`}>
                <input type="checkbox" name="availableWeekends" defaultChecked={checked("availableWeekends")} className="size-4 accent-accent" />
                {p.weekends}
              </label>
            </div>
          </fieldset>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ExpectedPayField dict={dict} amount={one("expectedPay")} period={one("expectedPayPeriod") || "MONTH"} error={err("expectedPay")} />
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-semibold">{p.workplace}</legend>
            <div className="flex flex-wrap gap-2">
              {(["ONSITE", "REMOTE", "ANY"] as const).map((w) => (
                <label key={w} className={`${choice} ${tallChoice} flex-auto justify-center whitespace-nowrap`}>
                  <input type="radio" name="workplace" value={w} defaultChecked={(one("workplace") || "ONSITE") === w} className="sr-only" />
                  {p.workplaceOptions[w]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Section>

      <Section title={p.portfolio}>
        <ImagesField
          existing={portfolio}
          files={files}
          setFiles={setFiles}
          removed={removed}
          setRemoved={setRemoved}
          error={err("images")}
          texts={{ ...dict.upload, imagesTitle: p.portfolio, imagesHint: p.portfolioHint }}
        />
      </Section>

      <Section title={p.visibility}>
        <label className={`${choice} text-base`}>
          <input type="checkbox" name="visible" defaultChecked={checked("visible")} className="size-5 accent-accent" />
          {p.visible}
        </label>
        <p className="text-sm text-muted">{p.visibleHint}</p>
      </Section>

      <div className="space-y-2">
        <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full sm:w-auto`}>
          {pending ? dict.upload.uploading : p.save}
        </button>
        {hasErrors && (
          <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-sm text-error">
            {p.formHasErrors}
          </p>
        )}
        {state?.saved && (
          <p role="status" className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
            ✓ {p.saved}
          </p>
        )}
      </div>
    </form>
  );
}
