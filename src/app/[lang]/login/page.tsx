import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/AuthForms";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/validation";

export default async function LoginPage({ searchParams }: PageProps<"/[lang]/login">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <AuthCard title={dict.auth.loginTitle}>
      <Suspense fallback={<p className="text-muted">{dict.home.loading}</p>}>
        <Login lang={lang} dict={dict} searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function Login({
  lang,
  dict,
  searchParams,
}: {
  lang: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[lang]/login">["searchParams"];
}) {
  const { next } = await searchParams;
  const nextPath = safeNext(next, "") || undefined;
  if (await getCurrentUser()) redirect(nextPath ?? `/${lang}`);

  return <LoginForm lang={lang} next={nextPath} t={dict.auth} />;
}
