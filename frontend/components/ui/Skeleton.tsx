interface SkeletonProps {
  className?: string;
}

/** A single pulsing placeholder block. Compose several for skeleton layouts. */
export function Skeleton({ className = "" }: SkeletonProps): JSX.Element {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/70 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Convenience skeleton for a grid of stat/summary cards. */
export function SkeletonCardGrid({ count = 3 }: { count?: number }): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-surface p-card"
        >
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Convenience skeleton for tabular data. */
export function SkeletonTable({ rows = 5 }: { rows?: number }): JSX.Element {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export default Skeleton;
