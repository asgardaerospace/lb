/**
 * Loading skeletons. Pure CSS shimmer using a slate gradient — no JS, safe in
 * server components. Use the bare `<Skeleton>` for ad-hoc bars, or one of the
 * convenience patterns when the shape matches.
 */

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

const ROUNDED: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

export function Skeleton({
  className = "",
  height = "h-3",
  width = "w-full",
  rounded = "md",
}: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse bg-slate-800/70 ${ROUNDED[rounded]} ${height} ${width} ${className}`}
    />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  /** Show a leading toolbar shimmer (search/filter row). */
  toolbar?: boolean;
}

export function TableSkeleton({
  rows = 6,
  columns = 5,
  toolbar = false,
}: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40"
    >
      {toolbar && (
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-3 py-2">
          <Skeleton width="w-56" height="h-7" />
          <Skeleton width="w-24" height="h-7" />
          <div className="ml-auto">
            <Skeleton width="w-20" height="h-7" />
          </div>
        </div>
      )}
      <div className="grid border-b border-slate-800 bg-slate-900/70 px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width="w-2/3" height="h-2.5" />
        ))}
      </div>
      <div className="divide-y divide-slate-800/80">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid items-center px-4 py-3"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                width={c === 0 ? "w-3/4" : c === columns - 1 ? "w-1/3" : "w-1/2"}
                height="h-3"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
    >
      <Skeleton width="w-1/3" height="h-3" className="mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "w-1/2" : "w-full"}
          height="h-2.5"
          className="mt-2"
        />
      ))}
    </div>
  );
}

export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mb-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
        >
          <Skeleton width="w-1/2" height="h-2.5" />
          <Skeleton width="w-2/3" height="h-6" className="mt-3" />
          <Skeleton width="w-1/3" height="h-2" className="mt-2" />
        </div>
      ))}
    </div>
  );
}
