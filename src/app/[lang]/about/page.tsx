import { ArrowRight, Briefcase, Mail, MessageCircle, Phone, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHero } from "@/components/home/PageHero";
import { buttonClass } from "@/components/ui";
import { site } from "@/config/site";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getDictionary(await getLocale()).about.title };
}

function Steps({ icon, title, steps }: { icon: ReactNode; title: string; steps: string[] }) {
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-6">
      <h2 className="flex items-center gap-3 font-heading text-xl font-bold">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">{icon}</span>
        {title}
      </h2>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-ink">{i + 1}</span>
            <span className="pt-0.5 leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Static content: the whole page is prerendered per language
export default async function AboutPage() {
  const lang = await getLocale();
  const dict = getDictionary(lang);
  const a = dict.about;
  const { email, phone, whatsapp } = site.contact as { email: string; phone: string; whatsapp: string };
  const contacts = [
    email && { icon: <Mail className="size-5" aria-hidden />, label: a.email, value: email, href: `mailto:${email}` },
    phone && { icon: <Phone className="size-5" aria-hidden />, label: a.phone, value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    whatsapp && { icon: <MessageCircle className="size-5" aria-hidden />, label: a.whatsapp, value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, "")}` },
  ].filter(Boolean) as { icon: ReactNode; label: string; value: string; href: string }[];

  return (
    <div className="space-y-8">
      <PageHero>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{a.title}</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted">{a.lead}</p>
      </PageHero>

      <section className="max-w-3xl space-y-3">
        <h2 className="font-heading text-2xl font-bold">{a.whyTitle}</h2>
        <p className="text-lg leading-relaxed text-muted">{a.why}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Steps icon={<Search className="size-5" aria-hidden />} title={a.seekersTitle} steps={a.seekers} />
        <Steps icon={<Briefcase className="size-5" aria-hidden />} title={a.employersTitle} steps={a.employers} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href={`/${lang}/jobs`} className={buttonClass.primary}>
          {dict.home.allJobs}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href={`/${lang}/jobs/new`} className={buttonClass.secondary}>
          {dict.nav.postJob}
        </Link>
      </div>

      <section id="contact" className="space-y-4 rounded-2xl bg-accent-tint p-6">
        <h2 className="font-heading text-2xl font-bold">{a.contactTitle}</h2>
        <p className="text-muted">{a.contactLead}</p>
        {contacts.length === 0 ? (
          <p className="font-medium">{a.contactSoon}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-3">
            {contacts.map((c) => (
              <li key={c.label}>
                <a href={c.href} className="flex items-center gap-3 rounded-xl bg-surface p-4 hover:text-accent">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">{c.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm text-muted">{c.label}</span>
                    <span className="block truncate font-semibold">{c.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
