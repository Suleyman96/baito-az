import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AvatarForm } from "@/components/auth/AvatarForm";
import { PageHeader } from "@/components/PageHeader";
import { JobGridSkeleton } from "@/components/Skeletons";
import { WorkerProfileForm } from "@/components/WorkerProfileForm";
import { pickerOptions, professionGroups, skillGroups } from "@/config/professions";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { districtName } from "@/lib/format";
import { getDistrictPlaces, getFilterOptions } from "@/lib/jobs";
import { regions } from "@/config/regions";
import { SOCIAL_KINDS, socialInputValue, socialSelect } from "@/lib/social-links";
import { getOwnWorkerProfile } from "@/lib/worker-directory";
import { NEGOTIABLE } from "@/lib/worker-profile";

export default async function MyProfilePage() {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={dict.workerProfile.title} subtitle={dict.workerProfile.subtitle} />
      <Suspense fallback={<JobGridSkeleton label={dict.home.loading} />}>
        <Profile lang={lang} dict={dict} />
      </Suspense>
    </div>
  );
}

const dateInput = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku" }).format(d);

async function Profile({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/my/profile`)}`);
  // Work profiles are for job seekers
  if (user.role !== "SEEKER") redirect(`/${lang}/account`);

  const [account, profile, [, districts]] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true, phone: true, avatarId: true, ...socialSelect } }),
    getOwnWorkerProfile(user.id),
    getFilterOptions(),
  ]);
  // The saved district's places, so the village list shows at once
  const places = profile ? await getDistrictPlaces(profile.district, profile.locationId ?? undefined) : undefined;

  // The saved profile as form values (a new profile starts from the account's name and phone)
  const initial: Record<string, string | string[]> = {
    name: account.name,
    phone: account.phone ?? "",
    ...Object.fromEntries(SOCIAL_KINDS.map((kind) => [kind, socialInputValue(kind, account[kind])])),
    ...(profile && {
      ageRange: profile.ageRange ?? "",
      bio: profile.bio ?? "",
      primaryProfession: profile.primaryProfession,
      additionalProfessions: profile.additionalProfessions,
      skills: profile.skills,
      experienceYears: profile.experienceYears?.toString() ?? "",
      workHistory: profile.workHistory ?? "",
      certificates: profile.certificates ?? "",
      district: profile.district,
      locationId: profile.locationId?.toString() ?? "",
      preferredDistricts: profile.preferredDistricts,
      maxCommuteKm: profile.maxCommuteKm?.toString() ?? "",
      willingToRelocate: profile.willingToRelocate ? "on" : "",
      workTypes: profile.workTypes,
      availableFrom: profile.availableFrom ? dateInput(profile.availableFrom) : "",
      availableWeekdays: profile.availableWeekdays ? "on" : "",
      availableWeekends: profile.availableWeekends ? "on" : "",
      expectedPay: profile.expectedPay?.toString() ?? "",
      expectedPayPeriod: profile.expectedPay ? profile.expectedPayPeriod : NEGOTIABLE,
      workplace: profile.workplace,
      visible: profile.visible ? "on" : "",
    }),
  };

  return (
    <>
      {profile && (
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-sm ${profile.visible ? "bg-success-soft text-success" : "bg-surface-2 text-muted"}`}>
          <span className="inline-flex items-center gap-2">
            {profile.visible ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
            {profile.visible ? dict.workerProfile.visible : dict.workers.hiddenNote}
          </span>
          <Link href={`/${lang}/workers/${user.id}`} className="font-semibold text-accent hover:underline">
            {dict.workerProfile.viewPublic}
          </Link>
        </div>
      )}
      <AvatarForm key={account.avatarId ?? "none"} lang={lang} dict={dict} name={account.name} avatarId={account.avatarId} />
      <WorkerProfileForm
        lang={lang}
        dict={dict}
        initial={initial}
        professions={pickerOptions(professionGroups, lang)}
        skills={pickerOptions(skillGroups, lang)}
        districts={districts.map((d) => ({ slug: d.slug, label: districtName(dict, d.slug), kind: regions.find((r) => r.slug === d.slug)?.kind ?? "rayon" }))}
        places={places}
        portfolio={profile?.portfolio.map((i) => i.id) ?? []}
        today={dateInput(new Date())}
      />
    </>
  );
}
