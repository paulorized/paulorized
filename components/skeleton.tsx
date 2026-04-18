// Reusable skeleton shimmer primitives

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-zinc-800/70 ${className}`} />
  );
}

export function HistoryRowSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function WishlistCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-3 items-center">
      <Skeleton className="h-14 w-14 rounded-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
      <div className="flex gap-2 w-full mt-1">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export function StrainDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-4">
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 divide-y divide-zinc-800">
        <div className="px-6 py-5 flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-5 w-28 rounded-full mt-2" />
          </div>
          <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
        </div>
        <div className="px-6 py-4 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
        <div className="px-6 py-4 flex gap-2">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
        <div className="px-6 py-4 flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
