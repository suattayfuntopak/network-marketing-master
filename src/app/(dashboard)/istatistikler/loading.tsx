import { Skeleton } from '@/components/ui/Skeleton'

/** İstatistikler — KPI + tablo iskeleti. */
export default function IstatistiklerLoading() {
  return (
    <div className="w-full space-y-6 px-4 pb-28 pt-6 md:pb-8" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-full max-w-lg rounded-xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}
