import { site } from "@/config/site";

/**
 * The Baito.az mark: a lowercase "b" with a dot beside it. The "b" is the job, the dot the person
 * who takes it, one step apart: the site brings the two together. It stays legible down to a 16px
 * favicon (the same drawing is in app/[lang]/icon.svg). Colors come from the --logo-* tokens in
 * globals.css, so the mark reads on light and dark headers and on the navy footer.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="9" style={{ fill: "var(--logo-bg)" }} />
      <g fill="none" strokeWidth="3.6" strokeLinecap="round" style={{ stroke: "var(--logo-fg)" }}>
        <path d="M10.5 7.5v17" />
        <circle cx="16.6" cy="18.6" r="5.9" />
      </g>
      <circle cx="23.4" cy="8.4" r="2.7" style={{ fill: "var(--logo-dot)" }} />
    </svg>
  );
}

/**
 * Mark + wordmark ("Baito" and an accent ".az"), for the header; `onDark` for the navy footer.
 * The name comes from site config, so a rename stays in one place.
 */
export function Logo({ size = "md", onDark = false }: { size?: "md" | "lg"; onDark?: boolean }) {
  const dot = site.name.lastIndexOf(".");
  const [word, domain] = dot > 0 ? [site.name.slice(0, dot), site.name.slice(dot)] : [site.name, ""];
  return (
    <span className={`flex items-center gap-2.5 ${onDark ? "logo-on-dark" : ""}`}>
      <LogoMark className={size === "lg" ? "size-10" : "size-9"} />
      <span className="font-heading text-xl font-extrabold tracking-tight">
        {word}
        {domain && <span style={{ color: "var(--logo-domain)" }}>{domain}</span>}
      </span>
    </span>
  );
}
