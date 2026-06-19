export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
      aria-hidden="true"
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function CardSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      {children}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6" aria-label="Loading...">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CardSkeleton>
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          </CardSkeleton>
        </div>
        <div className="space-y-4">
          <CardSkeleton>
            <Skeleton className="h-5 w-28 mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full mb-2" />
            ))}
          </CardSkeleton>
        </div>
      </div>
    </div>
  );
}
