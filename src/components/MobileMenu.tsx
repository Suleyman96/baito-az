"use client";

import { Menu, X } from "lucide-react";
import { useRef, type MouseEvent, type ReactNode } from "react";

/**
 * Phone menu behind a ☰ button. Built on <details>, so it also opens without JavaScript;
 * it closes itself when a link or button inside it is clicked.
 */
export function MobileMenu({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const closeOnNavigate = (e: MouseEvent) => {
    // Buttons marked data-keep-open (e.g. logout, which first asks in a dialog) leave the menu open
    const el = (e.target as HTMLElement).closest("a, button");
    if (el && !el.closest("[data-keep-open], dialog") && ref.current) ref.current.open = false;
  };

  return (
    <details ref={ref} className="group lg:hidden">
      <summary
        aria-label={label}
        className="flex size-11 cursor-pointer list-none items-center justify-center rounded-xl border border-line bg-surface [&::-webkit-details-marker]:hidden"
      >
        <Menu className="size-5 group-open:hidden" aria-hidden />
        <X className="hidden size-5 group-open:block" aria-hidden />
      </summary>
      <div onClick={closeOnNavigate} className="absolute inset-x-0 top-full border-b border-line bg-background px-4 pb-5 pt-3 shadow-lg">
        {children}
      </div>
    </details>
  );
}
