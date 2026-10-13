import type { ApplicationStatusValue } from "@/lib/applications";

const STYLE: Record<ApplicationStatusValue, string> = {
  NEW: "bg-info-soft text-info",
  REVIEWED: "bg-surface-2 text-muted",
  ACCEPTED: "bg-success-soft text-success",
  REJECTED: "bg-error-soft text-error",
};

export function ApplicationStatusBadge({ status, label }: { status: ApplicationStatusValue; label: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE[status]}`}>{label}</span>;
}
