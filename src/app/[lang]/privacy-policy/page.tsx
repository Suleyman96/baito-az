import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocument";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { privacyPolicy } from "@/i18n/legal/az";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getDictionary(await getLocale()).legal.privacyTitle };
}

// Static content: the whole page is prerendered per language
export default async function PrivacyPolicyPage() {
  const lang = await getLocale();
  return <LegalDocumentPage doc={privacyPolicy} dict={getDictionary(lang)} isAz={lang === "az"} />;
}
