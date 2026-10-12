"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";

// Runs in <head> before the page is painted. Without a saved choice, nothing is set
// and the CSS follows the system setting.
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

function currentTheme(): "light" | "dark" {
  const set = document.documentElement.getAttribute("data-theme");
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Re-render when the theme changes: a data-theme change on <html>, or the system setting
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

export function ThemeToggle({ label }: { label: string }) {
  // Known only in the browser; the server renders "off" and CSS shows the real knob position
  const dark = useSyncExternalStore(subscribe, () => currentTheme() === "dark", () => false);

  // React's dev-mode remount clears attributes on <html>; re-apply the saved theme (no-op in production)
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") document.documentElement.setAttribute("data-theme", saved);
    } catch {}
  }, []);

  function toggle() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  // The knob position and icon come from the dark: CSS variant, so the server HTML is right before hydration
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      onClick={toggle}
      aria-label={label}
      title={label}
      className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-gray-400 p-0.5 transition-colors hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-white shadow transition-transform dark:translate-x-5 dark:bg-gray-900">
        {/* Sun */}
        <svg viewBox="0 0 24 24" className="size-4 text-amber-500 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        {/* Moon */}
        <svg viewBox="0 0 24 24" className="hidden size-4 text-sky-200 dark:block" fill="currentColor" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      </span>
    </button>
  );
}
