import type { ReactNode } from "react";
import { PageHero } from "@/components/home/PageHero";
import { legal } from "@/config/legal";
import { site } from "@/config/site";
import type { Dictionary } from "@/i18n/dictionaries";

/** A paragraph, or a bulleted list */
export type LegalBlock = string | { list: string[] };
export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };
export type LegalDocument = { title: string; lead: string; sections: LegalSection[] };

// {token} in the texts → its value from the config, with what to fill in when it is still empty
const TOKENS: Record<string, { value: string; missing: string }> = {
  site: { value: site.name, missing: "saytın adı" },
  operatorName: { value: legal.operator.name, missing: "operatorun tam hüquqi adı" },
  operatorTaxId: { value: legal.operator.taxId, missing: "VÖEN" },
  operatorAddress: { value: legal.operator.address, missing: "hüquqi ünvan" },
  operatorEmail: { value: legal.operator.email, missing: "məxfilik sorğuları üçün e-poçt" },
  operatorPhone: { value: legal.operator.phone, missing: "əlaqə telefonu" },
  hosting: { value: legal.hosting, missing: "hostinq provayderi və ölkə" },
  responseDays: { value: legal.responseDays, missing: "cavab müddəti (gün)" },
  backupRetention: { value: legal.backupRetention, missing: "ehtiyat nüsxələrin saxlanma müddəti" },
};

/** Replaces {tokens}; an empty value shows as a highlighted placeholder, so nothing is ever invented */
function fill(text: string): ReactNode[] {
  return text.split(/(\{[a-zA-Z]+\})/).map((part, i) => {
    const token = TOKENS[part.slice(1, -1)];
    if (!token) return part;
    if (token.value) return token.value;
    return (
      <mark key={i} className="rounded bg-warning-soft px-1 font-semibold text-warning">
        [doldurulmalıdır: {token.missing}]
      </mark>
    );
  });
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/**
 * A legal text (Privacy Policy, Terms of Use): title, effective date, contents and numbered sections.
 * The text itself is Azerbaijani only; other languages get a note saying so.
 */
export function LegalDocumentPage({ doc, dict, isAz }: { doc: LegalDocument; dict: Dictionary; isAz: boolean }) {
  const t = dict.legal;
  return (
    <div className="space-y-10">
      <PageHero>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">{doc.title}</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted">{fill(doc.lead)}</p>
        <p className="text-sm text-muted">
          {t.effective}: {formatDate(legal.effectiveDate)}
        </p>
      </PageHero>

      {!isAz && (
        <p className="rounded-xl bg-accent-tint p-4 text-sm">
          {t.azOnly}
        </p>
      )}

      <div lang="az" className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:items-start">
        <nav aria-label={t.contents} className="space-y-3 rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24">
          <p className="text-sm font-semibold">{t.contents}</p>
          <ol className="space-y-1.5 text-sm">
            {doc.sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted hover:text-accent hover:underline">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 space-y-8">
          {doc.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 space-y-3">
              <h2 className="font-heading text-xl font-bold sm:text-2xl">
                {i + 1}. {s.title}
              </h2>
              {s.blocks.map((b, j) =>
                typeof b === "string" ? (
                  <p key={j} className="max-w-3xl leading-relaxed text-muted">
                    {fill(b)}
                  </p>
                ) : (
                  <ul key={j} className="max-w-3xl list-disc space-y-2 pl-5 leading-relaxed text-muted marker:text-accent">
                    {b.list.map((item, k) => (
                      <li key={k}>{fill(item)}</li>
                    ))}
                  </ul>
                ),
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
