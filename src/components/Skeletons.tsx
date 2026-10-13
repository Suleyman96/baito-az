// Grey placeholders shown while data streams in; they match the real layout so nothing jumps

const block = "animate-pulse rounded-lg bg-surface-2";

export function JobCardSkeleton() {
  return (
    <li aria-hidden className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
      <span className={`${block} size-11 rounded-xl`} />
      <span className={`${block} h-5 w-3/4`} />
      <span className={`${block} h-4 w-1/2`} />
      <span className="mt-2 flex justify-between border-t border-dashed border-line pt-3">
        <span className={`${block} h-5 w-28`} />
        <span className={`${block} h-5 w-16 rounded-full`} />
      </span>
    </li>
  );
}

export function JobGridSkeleton({ count = 6, label }: { count?: number; label: string }) {
  return (
    <div role="status" aria-label={label}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
}

export function SearchSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="rounded-[22px] bg-surface p-2.5 shadow-[0_12px_32px_rgba(23,32,51,0.12)] ring-1 ring-line">
      <div className="flex flex-wrap gap-2">
        <span className={`${block} h-[52px] flex-[2_1_240px] rounded-xl`} />
        <span className={`${block} h-[52px] flex-[2_1_300px] rounded-xl`} />
        <span className={`${block} h-[52px] flex-[1_0_110px] rounded-xl`} />
      </div>
    </div>
  );
}
