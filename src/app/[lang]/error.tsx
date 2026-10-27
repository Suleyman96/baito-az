"use client"; // Error boundaries must be Client Components

import { Home, RotateCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { ErrorState } from "@/components/errors/ErrorState";
import { useErrorTexts } from "@/components/errors/ErrorTexts";
import { buttonClass } from "@/components/ui";

/**
 * Unexpected errors in any page (e.g. the database is unreachable). The header and footer stay,
 * since the layout is outside this boundary. Nothing from the error itself is shown: in production
 * server errors arrive without their message anyway, and the details stay in the server logs.
 */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  const { lang, t } = useErrorTexts();

  useEffect(() => {
    // For the browser console only; the digest matches the server-side log entry
    console.error(error);
  }, [error]);

  return (
    <ErrorState badge={<TriangleAlert className="size-16 sm:size-20" />} title={t.errorTitle} text={t.errorText}>
      {/* retry() fetches the page from the server again and re-renders it; reset() would only re-render
          what already failed, which does not help when the error came from the server */}
      <button type="button" onClick={() => retry()} className={buttonClass.primary}>
        <RotateCw className="size-4" aria-hidden />
        {t.retry}
      </button>
      <Link href={`/${lang}`} className={buttonClass.secondary}>
        <Home className="size-4" aria-hidden />
        {t.home}
      </Link>
    </ErrorState>
  );
}
