import {
  ArrowRight,
  Building2,
  Eye,
  FileText,
  Handshake,
  Mail,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Star,
  Target,
  UserRound,
  UserSearch,
  Users,
} from "lucide-react";
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

const icon = "size-5";
// Icons for the "What we offer", "Who it is for" and "Values" items, in the dictionary's order
const OFFER_ICONS = [Megaphone, Search, FileText, Users, Send, Star];
const AUDIENCE_ICONS = [UserSearch, Building2, UserRound];
const VALUE_ICONS = [Smartphone, Eye, MousePointerClick, ShieldCheck];

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-heading text-2xl font-bold sm:text-3xl">{children}</h2>;
}

// Static content: the whole page is prerendered per language
export default async function AboutPage() {
  const lang = await getLocale();
  const dict = getDictionary(lang);
  const a = dict.about;
  const { email, phone, whatsapp } = site.contact as { email: string; phone: string; whatsapp: string };
  const contacts = [
    email && { icon: <Mail className={icon} aria-hidden />, label: a.email, value: email, href: `mailto:${email}` },
    phone && { icon: <Phone className={icon} aria-hidden />, label: a.phone, value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    whatsapp && { icon: <MessageCircle className={icon} aria-hidden />, label: a.whatsapp, value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, "")}` },
  ].filter(Boolean) as { icon: ReactNode; label: string; value: string; href: string }[];

  return (
    <div className="space-y-14">
      <PageHero>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">{a.title}</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted">{a.lead}</p>
      </PageHero>

      {/* Who we are + mission */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <section className="space-y-4">
          <SectionTitle>{a.whoTitle}</SectionTitle>
          {a.who.map((p, i) => (
            <p key={i} className="max-w-2xl text-lg leading-relaxed text-muted">
              {p}
            </p>
          ))}
        </section>
        <section className="space-y-3 rounded-2xl bg-brand p-6 text-on-brand sm:p-7">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/15">
            <Target className="size-6" aria-hidden />
          </span>
          <h2 className="font-heading text-xl font-bold">{a.missionTitle}</h2>
          <p className="leading-relaxed opacity-90">{a.mission}</p>
        </section>
      </div>

      {/* What we offer: only what the site does today */}
      <section className="space-y-5">
        <div className="space-y-2">
          <SectionTitle>{a.offerTitle}</SectionTitle>
          <p className="max-w-2xl text-muted">{a.offerLead}</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {a.offers.map((item, i) => {
            const Icon = OFFER_ICONS[i] ?? Megaphone;
            return (
              <li key={item.title} className="space-y-2 rounded-2xl border border-line bg-surface p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon className={icon} aria-hidden />
                </span>
                <h3 className="font-heading text-lg font-bold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{item.text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Who it is for */}
      <section className="space-y-5">
        <SectionTitle>{a.audienceTitle}</SectionTitle>
        <ul className="grid gap-4 md:grid-cols-3">
          {a.audiences.map((item, i) => {
            const Icon = AUDIENCE_ICONS[i] ?? UserRound;
            return (
              <li key={item.title} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
                  <Icon className={icon} aria-hidden />
                </span>
                <div className="space-y-1">
                  <h3 className="font-heading text-lg font-bold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{item.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Values */}
      <section className="space-y-5">
        <SectionTitle>{a.valuesTitle}</SectionTitle>
        <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {a.values.map((item, i) => {
            const Icon = VALUE_ICONS[i] ?? Handshake;
            return (
              <li key={item.title} className="space-y-2">
                <span className="flex items-center gap-2 font-heading text-lg font-bold">
                  <Icon className="size-5 text-accent" aria-hidden />
                  {item.title}
                </span>
                <p className="text-sm leading-relaxed text-muted">{item.text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Call to action: job seekers and employers */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-2xl bg-accent-tint p-6">
          <h2 className="font-heading text-xl font-bold">{a.ctaSeekers.title}</h2>
          <p className="flex-1 text-muted">{a.ctaSeekers.text}</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${lang}/register`} className={buttonClass.primary}>
              {a.ctaSeekers.register}
            </Link>
            <Link href={`/${lang}/jobs`} className={buttonClass.secondary}>
              {a.ctaSeekers.browse}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
        <section className="flex flex-col gap-3 rounded-2xl bg-accent-tint p-6">
          <h2 className="font-heading text-xl font-bold">{a.ctaEmployers.title}</h2>
          <p className="flex-1 text-muted">{a.ctaEmployers.text}</p>
          <div className="flex flex-wrap gap-2">
            {/* Guests are sent to employer sign-up and come back to the form */}
            <Link href={`/${lang}/jobs/new`} className={buttonClass.primary}>
              {a.ctaEmployers.post}
            </Link>
            <Link href={`/${lang}/workers`} className={buttonClass.secondary}>
              {a.ctaEmployers.workers}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </div>

      <section id="contact" className="space-y-4 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-heading text-2xl font-bold">{a.contactTitle}</h2>
        <p className="text-muted">{a.contactLead}</p>
        {contacts.length === 0 ? (
          <p className="font-medium">{a.contactSoon}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-3">
            {contacts.map((c) => (
              <li key={c.label}>
                <a href={c.href} className="flex items-center gap-3 rounded-xl bg-surface-2 p-4 hover:text-accent">
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
