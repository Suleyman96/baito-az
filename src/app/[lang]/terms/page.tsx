import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocument";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { termsOfUse } from "@/i18n/legal/az";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getDictionary(await getLocale()).legal.termsTitle };
}

// Static content: the whole page is prerendered per language
export default async function TermsPage() {
  const lang = await getLocale();
  return <LegalDocumentPage doc={termsOfUse} dict={getDictionary(lang)} isAz={lang === "az"} />;
}
