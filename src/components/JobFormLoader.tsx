import type { ComponentProps } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { db } from "@/lib/db";
import { districtName } from "@/lib/format";
import { getFilterOptions } from "@/lib/jobs";
import { JobForm } from "./JobForm";

type Props = Pick<ComponentProps<typeof JobForm>, "lang" | "dict" | "action" | "initial" | "submitLabel" | "existingImages"> & { userId: string };

/** Loads what the job form needs (categories, villages, the employer's phone) and renders it. */
export async function JobFormLoader({ userId, dict, ...props }: Props) {
  const [[categories, districts], owner] = await Promise.all([
    getFilterOptions(),
    db.user.findUnique({ where: { id: userId }, select: { phone: true, company: { select: { phone: true } } } }),
  ]);
  // Local date in Baku, for the date picker's minimum
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku" }).format(new Date());

  return (
    <JobForm
      {...props}
      dict={dict}
      categories={categories.map((c) => ({ id: c.id, label: dict.categories[c.slug as keyof Dictionary["categories"]] ?? c.slug }))}
      districts={districts.map((d) => ({ ...d, label: districtName(dict, d.slug) }))}
      defaultPhone={owner?.company?.phone ?? owner?.phone ?? undefined}
      today={today}
    />
  );
}
