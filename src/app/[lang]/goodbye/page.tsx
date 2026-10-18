import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

/** Where a user lands after deleting their profile (they are already logged out). */
export default async function GoodbyePage() {
  const lang = await getLocale();
  const d = getDictionary(lang).account.deleteProfile;

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-line bg-surface p-8 text-center">
      <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />
      <h1 className="font-heading text-2xl font-bold">{d.goodbyeTitle}</h1>
      <p className="text-muted">{d.goodbyeText}</p>
      <Link href={`/${lang}`} className={buttonClass.primary}>
        {d.goodbyeHome}
      </Link>
    </div>
  );
}
