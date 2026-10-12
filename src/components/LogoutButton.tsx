"use client";

import { LogOut } from "lucide-react";
import { useRef, type MouseEvent } from "react";
import { buttonClass } from "./ui";

/**
 * Logout button inside the logout <form>. It first asks for confirmation in a dialog;
 * without JavaScript it simply submits the form.
 */
export function LogoutButton({
  className,
  showLabel,
  texts,
}: {
  className: string;
  showLabel: boolean;
  texts: { logout: string; question: string; cancel: string };
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  const ask = (e: MouseEvent) => {
    e.preventDefault();
    dialog.current?.showModal();
  };

  return (
    <>
      {/* data-keep-open: the phone menu must stay open, or the dialog inside it would be hidden */}
      <button type="submit" onClick={ask} data-keep-open aria-label={texts.logout} title={texts.logout} className={className}>
        <LogOut className="size-4" aria-hidden />
        {showLabel && texts.logout}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="logout-question"
        // Clicking the dimmed area outside the box closes it
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto w-[min(92vw,380px)] rounded-2xl border border-line bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/40"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
            <LogOut className="size-5" aria-hidden />
          </span>
          <p id="logout-question" className="font-heading text-lg font-bold">
            {texts.question}
          </p>
          <div className="flex w-full gap-2">
            <button type="button" onClick={() => dialog.current?.close()} autoFocus className={`${buttonClass.secondary} flex-1`}>
              {texts.cancel}
            </button>
            {/* Inside the logout form, so this submits it */}
            <button type="submit" className={`${buttonClass.primary} flex-1`}>
              {texts.logout}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
