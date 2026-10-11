import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/AuthForms";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/validation";

export default async function RegisterPage({ searchParams }: PageProps<"/[lang]/register">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <AuthCard title={dict.auth.registerTitle}>
      <Suspense fallback={<p className="text-muted">{dict.home.loading}</p>}>
        <Register lang={lang} dict={dict} searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function Register({
  lang,
  dict,
  searchParams,
}: {
  lang: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[lang]/register">["searchParams"];
}) {
  const { next, role } = await searchParams;
  const nextPath = safeNext(next, "") || undefined;
  if (await getCurrentUser()) redirect(nextPath ?? `/${lang}`);

  return <RegisterForm lang={lang} next={nextPath} role={role === "EMPLOYER" ? "EMPLOYER" : "SEEKER"} t={dict.auth} />;
}
