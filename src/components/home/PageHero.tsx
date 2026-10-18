import type { ReactNode } from "react";
import { WorkScenes } from "./WorkScenes";

/**
 * The full-width band at the top of the home, About, Jobs and Job seekers pages: a soft brand-blue
 * gradient with the work line-art pattern, and people at work along its bottom edge
 * (globals.css .hero-surface / .hero-pattern). The page's heading and search go inside.
 */
export function PageHero({ children }: { children: ReactNode }) {
  return (
    // Pulled out of the page container to span the window, up to the header
    <section className="relative -mt-6 mx-[calc(50%-50vw)] overflow-hidden hero-surface">
      <div aria-hidden className="hero-pattern pointer-events-none absolute inset-0" />
      {/* The bottom padding leaves room for the people at work */}
      <div className="relative z-10 mx-auto max-w-6xl space-y-5 px-4 pb-20 pt-8 sm:px-6 sm:pb-28 sm:pt-10">{children}</div>
      <WorkScenes className="absolute inset-x-0 bottom-0 h-16 text-hero-figure sm:h-24" />
    </section>
  );
}
