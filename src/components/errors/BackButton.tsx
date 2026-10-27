"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui";

/** Goes back one page; when the page was opened directly (no history), goes to `fallback` instead. */
export function BackButton({ label, fallback }: { label: string; fallback: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className={buttonClass.secondary}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </button>
  );
}
