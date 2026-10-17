import type { SVGProps } from "react";
import type { SocialKind } from "@/lib/social-links";

// Outline icons in the same style as the site's lucide icons (24px grid, 2px rounded stroke),
// drawn here because lucide does not ship brand logos.
const paths: Record<SocialKind, React.ReactNode> = {
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  tiktok: <path d="M9 12a4 4 0 1 0 4 4V2c.5 3 2.5 5 6 5" />,
  whatsapp: (
    <>
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9z" />
      <path d="M9.5 8.5 8.5 10c.5 2.5 3 5 5.5 5.5l1.5-1-1.75-1.5-1.25.75c-1-.5-1.75-1.25-2.25-2.25l.75-1.25z" />
    </>
  ),
  telegram: (
    <>
      <path d="m22 2-7 20-4-9-9-4z" />
      <path d="M22 2 11 13" />
    </>
  ),
};

export function SocialIcon({ kind, ...props }: { kind: SocialKind } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {paths[kind]}
    </svg>
  );
}
