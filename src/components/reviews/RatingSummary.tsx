import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/lib/format";
import { Stars } from "./Stars";

/** "★★★★★ 4.7 · 3 reviews", or "No reviews yet". */
export function RatingSummary({ summary, dict, size = "sm" }: { summary: { average: number | null; count: number }; dict: Dictionary; size?: "sm" | "md" }) {
  if (summary.average === null) return <span className="text-sm text-muted">{dict.reviews.noReviews}</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Stars rating={summary.average} size={size} />
      <span className={`font-semibold ${size === "md" ? "text-lg" : "text-sm"}`}>{summary.average.toFixed(1)}</span>
      <span className="text-sm text-muted">· {t(dict.reviews.count, { count: summary.count })}</span>
    </span>
  );
}
