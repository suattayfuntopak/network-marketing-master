import { Skeleton } from './Skeleton'

/** Default skeleton while dashboard route segments load (Next.js `loading.tsx`). */
export function DashboardLoading() {
  return (
    <div
      className="w-full space-y-5 px-4 pb-28 pt-6 md:pb-8"
      role="status"
      aria-label="Loading"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-52 max-w-full" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-[14px]" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  )
}
