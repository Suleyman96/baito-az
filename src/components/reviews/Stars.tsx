import { Star } from "lucide-react";

/** Read-only stars for a rating (rounded to the nearest whole star), with a text label for screen readers. */
export function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const icon = size === "md" ? "size-5" : "size-4";
  const full = Math.round(rating);
  return (
    <span role="img" aria-label={`${rating} / 5`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${icon} ${n <= full ? "fill-accent text-accent" : "text-line-strong"}`} aria-hidden />
      ))}
    </span>
  );
}
