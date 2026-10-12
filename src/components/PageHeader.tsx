import type { ReactNode } from "react";

/** Title block at the top of a content page. */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      {subtitle && <p className="max-w-2xl text-lg text-muted">{subtitle}</p>}
      {children}
    </div>
  );
}
