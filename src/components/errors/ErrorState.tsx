import type { ReactNode } from "react";

/**
 * The 404 and error pages' content: a large code or icon, a heading, a short explanation and the
 * actions. Plain markup with no hooks, so the server not-found page and the client error pages share it.
 */
export function ErrorState({ badge, title, text, children }: { badge: ReactNode; title: string; text: string; children: ReactNode }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-5 py-12 text-center sm:py-20">
      <span aria-hidden className="font-heading text-6xl font-extrabold tracking-tight text-accent sm:text-7xl">
        {badge}
      </span>
      <h1 className="font-heading text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="text-lg leading-relaxed text-muted">{text}</p>
      <div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row">{children}</div>
    </section>
  );
}
