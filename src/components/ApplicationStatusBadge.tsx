import type { ApplicationStatusValue } from "@/lib/applications";

const STYLE: Record<ApplicationStatusValue, string> = {
  NEW: "bg-accent-soft text-accent-ink",
  REVIEWED: "bg-surface-2 text-muted",
  ACCEPTED: "bg-brand-soft text-brand-strong",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function ApplicationStatusBadge({ status, label }: { status: ApplicationStatusValue; label: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE[status]}`}>{label}</span>;
}
