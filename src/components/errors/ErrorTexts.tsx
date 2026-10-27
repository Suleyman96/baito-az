"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type ErrorTexts = { lang: Locale; t: Dictionary["errorPage"] };

const Context = createContext<ErrorTexts | null>(null);

/**
 * Hands the error page's texts to [lang]/error.tsx. Error boundaries are Client Components and the
 * dictionaries are server-only, so the layout passes just this small part of the dictionary down.
 * The layout sits above the error boundary, so its texts are still there when a page fails.
 */
export function ErrorTextsProvider({ lang, t, children }: ErrorTexts & { children: ReactNode }) {
  return <Context value={{ lang, t }}>{children}</Context>;
}

export function useErrorTexts() {
  const texts = useContext(Context);
  if (!texts) throw new Error("useErrorTexts must be used inside ErrorTextsProvider");
  return texts;
}
