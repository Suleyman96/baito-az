import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountForms } from "@/components/auth/AccountForms";
import { AvatarForm } from "@/components/auth/AvatarForm";
import { ResumeForm } from "@/components/auth/ResumeForm";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function AccountPage() {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{dict.account.title}</h1>
      <Suspense fallback={<p className="text-muted">{dict.home.loading}</p>}>
        <Account lang={lang} dict={dict} />
      </Suspense>
    </div>
  );
}

async function Account({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const current = await getCurrentUser();
  if (!current) redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/account`)}`);
  const user = await db.user.findUniqueOrThrow({
    where: { id: current.id },
    select: {
      name: true,
      email: true,
      phone: true,
      avatarId: true,
      role: true,
      resume: { select: { id: true, fileName: true, size: true, createdAt: true } },
      company: { select: { name: true, description: true, phone: true, address: true, latitude: true, longitude: true } },
    },
  });
  const company = user.company;

  return (
    <div className="space-y-4">
      {/* key: after a new photo is saved its id changes and the form starts fresh */}
      <AvatarForm key={user.avatarId ?? "none"} lang={lang} dict={dict} name={user.name} avatarId={user.avatarId} />
      {/* CVs are for job seekers; the apply form links here (#resume) */}
      {user.role === "SEEKER" && (
        <div id="resume" className="scroll-mt-24">
          <ResumeForm
            key={user.resume?.id ?? "none"}
            lang={lang}
            dict={dict}
            resume={
              user.resume && {
                id: user.resume.id,
                fileName: user.resume.fileName,
                size: user.resume.size,
                uploadedOn: new Intl.DateTimeFormat(lang, { timeZone: "Asia/Baku", dateStyle: "medium" }).format(user.resume.createdAt),
              }
            }
          />
        </div>
      )}
      <AccountForms
        lang={lang}
        dict={dict}
        user={{ name: user.name, email: user.email ?? "", phone: user.phone ?? "" }}
        company={
          company
            ? {
                // A private person's "company" carries their own name; show it as empty, as at sign-up
                name: company.name === user.name ? "" : company.name,
                description: company.description ?? "",
                phone: company.phone ?? "",
                address: company.address ?? "",
                latitude: company.latitude === null ? "" : String(company.latitude),
                longitude: company.longitude === null ? "" : String(company.longitude),
              }
            : undefined
        }
      />
    </div>
  );
}
