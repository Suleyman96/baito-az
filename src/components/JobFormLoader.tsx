import type { ComponentProps } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { db } from "@/lib/db";
import { districtName } from "@/lib/format";
import { getDistrictPlaces, getFilterOptions } from "@/lib/jobs";
import { JobForm } from "./JobForm";

type Props = Pick<ComponentProps<typeof JobForm>, "lang" | "dict" | "action" | "initial" | "submitLabel" | "existingImages"> & { userId: string };

/** Loads what the job form needs (categories, districts, the chosen district's places, the employer's phone) and renders it. */
export async function JobFormLoader({ userId, dict, ...props }: Props) {
  const district = props.initial?.district;
  const [[categories, districts], owner, places] = await Promise.all([
    getFilterOptions(),
    db.user.findUnique({ where: { id: userId }, select: { phone: true, company: { select: { phone: true } } } }),
    district ? getDistrictPlaces(district, Number(props.initial?.locationId) || undefined) : undefined,
  ]);
  // Local date in Baku, for the date picker's minimum
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku" }).format(new Date());

  return (
    <JobForm
      {...props}
      dict={dict}
      categories={categories.map((c) => ({ id: c.id, label: dict.categories[c.slug as keyof Dictionary["categories"]] ?? c.slug }))}
      districts={districts.map((d) => ({ slug: d.slug, label: districtName(dict, d.slug) }))}
      places={places}
      defaultPhone={owner?.company?.phone ?? owner?.phone ?? undefined}
      today={today}
    />
  );
}
