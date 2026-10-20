"use client";

import { useActionState, useState } from "react";
import { buttonClass, Field, inputClass } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { JobFormState } from "@/lib/job-actions";
import { MAX_JOB_IMAGES } from "@/lib/images";
import { t as fill } from "@/lib/format";
import { ImagesField } from "./ImagesField";
import { LocationSelect } from "./LocationSelect";

type District = { slug: string; label: string };
type Place = { id: number; name: string };
type Category = { id: number; label: string };

const TYPES = ["FULL_TIME", "PART_TIME", "ONE_DAY"] as const;
// Radio ids used by the CSS rules below. No underscores: Tailwind reads "_" in arbitrary selectors as a space
const typeId = (type: (typeof TYPES)[number]) => `type-${type.toLowerCase().replace("_", "-")}`;


export function JobForm({
  lang,
  dict,
  categories,
  districts,
  places,
  defaultPhone,
  today,
  action: submit,
  initial,
  submitLabel,
  existingImages = [],
}: {
  lang: Locale;
  dict: Dictionary;
  categories: Category[];
  districts: District[];
  /** Places of the initial district (`initial.district`), so the village list shows at once */
  places?: Place[];
  defaultPhone?: string;
  /** Today's date in Baku, YYYY-MM-DD, for the date picker's minimum */
  today: string;
  /** Server action: creates a job, or updates one when bound to its id */
  action: (prev: JobFormState, formData: FormData) => Promise<JobFormState>;
  /** Form values of an existing job (edit) or the job being copied (duplicate) */
  initial?: Record<string, string>;
  submitLabel?: string;
  /** Ids of images the job already has (edit) */
  existingImages?: string[];
}) {
  const [state, action, pending] = useActionState(submit, undefined);
  const t = dict.postJob;
  const v = state?.values ?? initial ?? {};
  const err = (field: string) => {
    const key = state?.errors[field];
    if (!key) return undefined;
    // Image errors are shared with profile photos, so their texts live in dict.upload
    return key in t.errors ? t.errors[key as keyof typeof t.errors] : fill(dict.upload[key as keyof typeof dict.upload], { max: MAX_JOB_IMAGES });
  };
  // Chosen images live here, outside the <form> below (which remounts after a server error), so they survive it
  const [files, setFiles] = useState<File[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const type = TYPES.find((x) => x === v.employmentType) ?? "FULL_TIME";
  const hasErrors = !!state && Object.keys(state.errors).length > 0;
  const payLabel = { MONTH: t.payMonth, DAY: t.payDay, HOUR: t.payHour, JOB: t.payJob };

  return (
    // "group" lets the one-day / monthly sections react to the job type radio with CSS only, so it also works without JavaScript
    // key: React resets uncontrolled fields after an action; remounting with the returned values keeps them
    <form key={JSON.stringify(v)} action={action} className="group space-y-5" noValidate>
      <input type="hidden" name="lang" value={lang} />

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t.typeQuestion}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {TYPES.map((x) => (
            <label key={x} className="cursor-pointer rounded-xl border-2 border-line bg-surface p-3 has-checked:border-accent has-checked:bg-brand-soft">
              <input type="radio" name="employmentType" value={x} id={typeId(x)} defaultChecked={type === x} className="sr-only" />
              <span className="block font-semibold">{dict.jobType[x]}</span>
              <span className="block text-sm text-muted">{t.typeHint[x]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={t.titleLabel} error={err("title")}>
        <input name="title" defaultValue={v.title} placeholder={t.titlePlaceholder} maxLength={100} aria-invalid={!!err("title")} className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t.category} error={err("categoryId")}>
          <select name="categoryId" defaultValue={v.categoryId ?? ""} aria-invalid={!!err("categoryId")} className={inputClass}>
            <option value="">{t.chooseCategory}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        {/* District + village; the error belongs to the village select */}
        <div className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">{t.location}</span>
          <div className="grid gap-2 sm:grid-cols-2">
            <LocationSelect
              districts={districts}
              district={v.district || undefined}
              location={v.locationId ? Number(v.locationId) : undefined}
              places={v.district && v.district === initial?.district ? places : undefined}
              labels={{ allDistricts: t.chooseDistrict, allVillages: t.chooseVillage }}
              villageName="locationId"
              className={inputClass}
            />
          </div>
          {err("locationId") && <span className="block text-sm text-error">{err("locationId")}</span>}
        </div>
      </div>

      {/* One-day job: date, time, duration, workers, pay */}
      <div className="hidden space-y-4 rounded-xl border border-line p-4 group-has-[#type-one-day:checked]:block">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.workDate} error={err("workDate")}>
            <input type="date" name="workDate" min={today} defaultValue={v.workDate} aria-invalid={!!err("workDate")} className={inputClass} />
          </Field>
          <Field label={t.startTime}>
            <input type="time" name="startTime" defaultValue={v.startTime} className={inputClass} />
          </Field>
          <Field label={t.durationHours} error={err("durationHours")}>
            <input type="number" name="durationHours" min={1} max={24} inputMode="numeric" defaultValue={v.durationHours} aria-invalid={!!err("durationHours")} className={inputClass} />
          </Field>
          <Field label={t.workersNeeded} error={err("workersNeeded")}>
            <input type="number" name="workersNeeded" min={1} max={100} inputMode="numeric" defaultValue={v.workersNeeded || "1"} aria-invalid={!!err("workersNeeded")} className={inputClass} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.payAmount} hint={t.salaryHint} error={err("payAmount")}>
            <input type="number" name="payAmount" min={1} inputMode="numeric" defaultValue={v.payAmount} aria-invalid={!!err("payAmount")} className={inputClass} />
          </Field>
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">{t.payType}</legend>
            <div className="flex gap-2">
              {(["JOB", "DAY", "HOUR"] as const).map((p) => (
                <label key={p} className="flex-1 cursor-pointer rounded-xl border border-line-strong px-2 py-2.5 text-center text-sm has-checked:border-accent has-checked:bg-brand-soft has-checked:font-medium">
                  <input type="radio" name="payPeriod" value={p} defaultChecked={(v.payPeriod || "JOB") === p} className="sr-only" />
                  {payLabel[p]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      {/* Full-time / part-time: monthly salary range */}
      <div className="grid gap-4 sm:grid-cols-2 group-has-[#type-one-day:checked]:hidden">
        <fieldset className="space-y-1 sm:col-span-2">
          <legend className="text-sm font-medium">{t.payType}</legend>
          <div className="flex gap-2 sm:w-2/3">
            {(["MONTH", "DAY", "HOUR"] as const).map((p) => (
              <label key={p} className="flex-1 cursor-pointer rounded-xl border border-line-strong px-2 py-2.5 text-center text-sm has-checked:border-accent has-checked:bg-brand-soft has-checked:font-medium">
                <input type="radio" name="salaryPeriod" value={p} defaultChecked={(v.salaryPeriod || "MONTH") === p} className="sr-only" />
                {payLabel[p]}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label={t.salaryMin} hint={t.salaryHint} error={err("salaryMin")}>
          <input type="number" name="salaryMin" min={1} inputMode="numeric" defaultValue={v.salaryMin} aria-invalid={!!err("salaryMin")} className={inputClass} />
        </Field>
        <Field label={t.salaryMax} error={err("salaryMax")}>
          <input type="number" name="salaryMax" min={1} inputMode="numeric" defaultValue={v.salaryMax} aria-invalid={!!err("salaryMax")} className={inputClass} />
        </Field>
      </div>

      <Field label={t.description} error={err("description")}>
        <textarea name="description" rows={6} defaultValue={v.description} placeholder={t.descriptionPlaceholder} maxLength={3000} aria-invalid={!!err("description")} className={inputClass} />
      </Field>

      <ImagesField
        existing={existingImages}
        files={files}
        setFiles={setFiles}
        removed={removed}
        setRemoved={setRemoved}
        error={err("images")}
        texts={dict.upload}
      />

      <Field label={t.contactPhone} hint={`${t.contactPhoneHint} ${dict.auth.phoneHint}`} error={err("contactPhone")}>
        <input type="tel" name="contactPhone" inputMode="tel" autoComplete="tel" defaultValue={v.contactPhone ?? defaultPhone} aria-invalid={!!err("contactPhone")} className={inputClass} />
      </Field>

      <div className="space-y-2">
        <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full sm:w-auto`}>
          {submitLabel ?? t.submit}
        </button>
        {hasErrors ? (
          <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-sm text-error">
            {t.formHasErrors}
          </p>
        ) : (
          <p className="text-sm text-muted">{t.moderationNote}</p>
        )}
      </div>
    </form>
  );
}
