"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

/**
 * Account dropdown in the desktop header: the photo (and name on wide screens) opens a panel
 * with the account links. Built on <details>, so it also opens without JavaScript; closes on
 * outside clicks, Escape, and after choosing a link.
 */
export function AccountMenu({ label, trigger, children }: { label: string; trigger: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = (e: Event) => {
      const menu = ref.current;
      if (!menu?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menu.contains(e.target as Node)) menu.open = false;
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  // Choosing a link closes the panel; the logout button keeps it open, since its confirm dialog lives inside
  const closeOnNavigate = (e: MouseEvent) => {
    const el = (e.target as HTMLElement).closest("a, button");
    if (el && !el.closest("[data-keep-open], dialog") && ref.current) ref.current.open = false;
  };

  return (
    <details ref={ref} className="group relative">
      <summary
        aria-label={label}
        title={label}
        className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-surface-2 [&::-webkit-details-marker]:hidden"
      >
        {trigger}
        <ChevronDown className="size-4 text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <div onClick={closeOnNavigate} className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 shadow-xl">
        {children}
      </div>
    </details>
  );
}
