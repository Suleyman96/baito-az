import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/lib/format";
import { presentLinks, type SocialLinks } from "@/lib/social-links";
import { SocialIcon } from "./SocialIcons";

/** Buttons to a profile's social pages; nothing is rendered when none are set. */
export function SocialLinksList({ links, dict }: { links: Partial<SocialLinks>; dict: Dictionary }) {
  const items = presentLinks(links);
  if (items.length === 0) return null;
  const s = dict.social;

  return (
    <ul className="flex flex-wrap gap-2" aria-label={s.title}>
      {items.map((item) => (
        <li key={item.kind}>
          <a
            href={item.url}
            // New tab without giving the other site access to this page or passing it our address
            target="_blank"
            rel="noopener noreferrer nofollow"
            referrerPolicy="no-referrer"
            aria-label={t(s.open, { network: s.names[item.kind], name: item.label })}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface px-3 py-1.5 text-sm font-semibold transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
          >
            <SocialIcon kind={item.kind} className="size-4" />
            <span className="max-w-48 truncate">{item.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
